import { NextRequest, NextResponse } from "next/server";
import { GoogleAdsApi } from "google-ads-api";
import { reviewDraft, scanLandingPageContent } from "@/lib/policy";
import type { AdDraft, ReviewResponse } from "@/lib/types";

type RequestBody = {
  draft: AdDraft;
  runGoogleValidation?: boolean;
};

type LandingPageFetchResult =
  | {
      html: string;
    }
  | {
      error: string;
    };

async function tryFetchLandingPage(url: string): Promise<LandingPageFetchResult> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 GoogleAdsPolicyGuard/0.1"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        error: `Landing page returned HTTP ${response.status}.`
      };
    }

    const html = await response.text();
    return { html };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch landing page."
    };
  }
}

async function validateWithGoogleAds(draft: AdDraft, review: ReviewResponse) {
  const developer_token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const client_id = process.env.GOOGLE_ADS_CLIENT_ID;
  const client_secret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refresh_token = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customer_id = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const login_customer_id = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!developer_token || !client_id || !client_secret || !refresh_token || !customer_id) {
    review.googleValidation = {
      attempted: false,
      status: "not_configured",
      message: "Google Ads credentials are not configured in environment variables."
    };
    return review;
  }

  try {
    const client = new GoogleAdsApi({
      client_id,
      client_secret,
      developer_token
    });

    const customer = client.Customer({
      customer_id,
      login_customer_id,
      refresh_token
    });

    await customer.adGroupAds.create(
      [
        {
          ad_group: "customers/PLACEHOLDER/adGroups/PLACEHOLDER",
          status: "PAUSED",
          ad: {
            final_urls: [draft.finalUrl],
            responsive_search_ad: {
              headlines: draft.headlines
                .filter(Boolean)
                .slice(0, 15)
                .map((text) => ({ text })),
              descriptions: draft.descriptions
                .filter(Boolean)
                .slice(0, 4)
                .map((text) => ({ text }))
            }
          }
        }
      ],
      { validate_only: true }
    );

    review.googleValidation = {
      attempted: true,
      status: "validated",
      message:
        "Validate-only call succeeded. Replace placeholder ad group wiring before production use."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Ads validation failed.";
    review.googleValidation = {
      attempted: true,
      status: "failed",
      message,
      details: [
        "This starter project ships with placeholder ad group wiring.",
        "Connect real campaign and ad group selection before production submission."
      ]
    };
  }

  return review;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RequestBody;

  if (!body?.draft) {
    return NextResponse.json({ error: "Missing draft payload." }, { status: 400 });
  }

  const landing = await tryFetchLandingPage(body.draft.finalUrl);
  const landingScan = "html" in landing ? scanLandingPageContent(landing.html) : undefined;
  let review = reviewDraft(body.draft, landingScan);

  if ("error" in landing) {
    review.issues.push({
      severity: "warn",
      code: "LANDING_PAGE_FETCH_FAILED",
      message: landing.error
    });
  }

  if (body.runGoogleValidation) {
    review = await validateWithGoogleAds(body.draft, review);
  }

  return NextResponse.json(review);
}
