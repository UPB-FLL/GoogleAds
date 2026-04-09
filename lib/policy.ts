import { AdDraft, LandingScanResult, ReviewResponse, RuleIssue } from "./types";

const ALLOWED_COUNTRIES = new Set(["US"]);
const BLOCKED_PHRASES = [
  "drink and drive",
  "drunk driving",
  "get drunk",
  "blackout",
  "drink all night",
  "boost confidence",
  "look sexier",
  "perform better",
  "health benefits",
  "stress cure"
];

const SOFT_ALCOHOL_TERMS = [
  "beer",
  "ipa",
  "lager",
  "ale",
  "cocktail",
  "wine",
  "whiskey",
  "bourbon",
  "tap list",
  "draft beer",
  "happy hour",
  "sour",
  "pilsner"
];

const FOOD_TERMS = [
  "pizza",
  "lunch",
  "dinner",
  "wood-fired",
  "wood fired",
  "private event",
  "event space",
  "catering",
  "group dining",
  "restaurant"
];

function containsPhrase(text: string, list: string[]) {
  const normalized = text.toLowerCase();
  return list.filter((term) => normalized.includes(term));
}

function addIssue(
  issues: RuleIssue[],
  severity: RuleIssue["severity"],
  code: string,
  message: string
) {
  issues.push({ severity, code, message });
}

export function scanLandingPageContent(html: string): LandingScanResult {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const headingMatches = [...html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)].map(
    (match) => stripTags(match[1])
  );

  const altMatches = [...html.matchAll(/alt=["']([^"']+)["']/gi)].map((match) => match[1]);
  const visibleText = stripTags(html);

  return {
    title: titleMatch ? stripTags(titleMatch[1]) : undefined,
    headings: headingMatches.slice(0, 12),
    alcoholTermsFound: unique(containsPhrase(visibleText, SOFT_ALCOHOL_TERMS)),
    foodTermsFound: unique(containsPhrase(visibleText, FOOD_TERMS)),
    imageHints: altMatches.slice(0, 10),
    notes: [
      `Detected ${headingMatches.length} headings`,
      `Detected ${altMatches.length} image alt text values`
    ]
  };
}

export function reviewDraft(
  draft: AdDraft,
  landingScan?: LandingScanResult
): ReviewResponse {
  const issues: RuleIssue[] = [];
  const allCopy = [...draft.headlines, ...draft.descriptions, draft.notes ?? ""].join(" ").trim();
  const copyLower = allCopy.toLowerCase();

  const blockedMatches = containsPhrase(copyLower, BLOCKED_PHRASES);
  if (blockedMatches.length) {
    addIssue(
      issues,
      "block",
      "ALCOHOL_UNSAFE_COPY",
      `Blocked phrases found: ${blockedMatches.join(", ")}.`
    );
  }

  if (draft.campaignMode !== "food" && !ALLOWED_COUNTRIES.has(draft.countryCode.toUpperCase())) {
    addIssue(
      issues,
      "block",
      "COUNTRY_NOT_ALLOWED",
      "Alcohol-related campaign mode selected outside the allowed country list."
    );
  }

  if (
    draft.campaignMode !== "food" &&
    ["customer_match", "remarketing", "custom_segment"].includes(draft.audienceType)
  ) {
    addIssue(
      issues,
      "block",
      "AUDIENCE_NOT_ALLOWED",
      "Audience type is not allowed for alcohol-related campaigns in this starter app."
    );
  }

  const softTermsInCopy = containsPhrase(copyLower, SOFT_ALCOHOL_TERMS);
  if (draft.campaignMode === "food" && softTermsInCopy.length) {
    addIssue(
      issues,
      "warn",
      "FOOD_CAMPAIGN_HAS_ALCOHOL_TERMS",
      `Food/events mode contains alcohol-forward terms: ${unique(softTermsInCopy).join(", ")}.`
    );
  }

  if (!draft.finalUrl.startsWith("http://") && !draft.finalUrl.startsWith("https://")) {
    addIssue(
      issues,
      "block",
      "INVALID_URL",
      "Final URL must start with http:// or https://."
    );
  }

  draft.headlines.forEach((headline, index) => {
    if (headline.length > 30) {
      addIssue(
        issues,
        "warn",
        `HEADLINE_${index + 1}_TOO_LONG`,
        `Headline ${index + 1} is longer than 30 characters.`
      );
    }
    if (/[!?]{2,}/.test(headline) || /[A-Z]{8,}/.test(headline)) {
      addIssue(
        issues,
        "warn",
        `HEADLINE_${index + 1}_EDITORIAL`,
        `Headline ${index + 1} may trigger editorial review for excessive caps or punctuation.`
      );
    }
  });

  draft.descriptions.forEach((description, index) => {
    if (description.length > 90) {
      addIssue(
        issues,
        "warn",
        `DESCRIPTION_${index + 1}_TOO_LONG`,
        `Description ${index + 1} is longer than 90 characters.`
      );
    }
  });

  if (landingScan) {
    if (
      draft.campaignMode === "food" &&
      landingScan.alcoholTermsFound.length > Math.max(2, landingScan.foodTermsFound.length)
    ) {
      addIssue(
        issues,
        "warn",
        "LANDING_PAGE_ALCOHOL_FORWARD",
        "Landing page looks more alcohol-forward than food/events-forward."
      );
    }

    if (!landingScan.foodTermsFound.length && draft.campaignMode === "food") {
      addIssue(
        issues,
        "warn",
        "LANDING_PAGE_WEAK_FOOD_SIGNAL",
        "Food/events campaign points to a page with weak food or event language."
      );
    }
  }

  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === "block" ? 35 : issue.severity === "warn" ? 12 : 4;
  }
  score = Math.max(0, score);

  const recommendation = issues.some((issue) => issue.severity === "block")
    ? "blocked"
    : issues.some((issue) => issue.severity === "warn")
      ? "needs_review"
      : "ready";

  return {
    score,
    recommendation,
    issues,
    landingScan,
    googleValidation: {
      attempted: false,
      status: "skipped",
      message: "No Google Ads validation attempted yet."
    }
  };
}

function stripTags(text: string) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return [...new Set(values)];
}
