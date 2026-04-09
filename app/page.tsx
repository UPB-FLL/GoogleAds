"use client";

import { useMemo, useState } from "react";
import type { AdDraft, ReviewResponse } from "@/lib/types";

const templates = {
  food: {
    headlines: [
      "Wood-Fired Pizza in Fort Lauderdale",
      "Lunch Specials Near Downtown",
      "Private Events & Group Dining"
    ],
    descriptions: [
      "Visit Uncommon Path for pizza, lunch, and a laid-back taproom setting.",
      "Plan team lunches, birthdays, and private events in Fort Lauderdale."
    ]
  },
  brewery_brand: {
    headlines: [
      "Visit Uncommon Path Brewing",
      "Fort Lauderdale Taproom & Kitchen",
      "Private Events at Our Brewery"
    ],
    descriptions: [
      "Discover our Fort Lauderdale brewery, kitchen, and private event space.",
      "See the taproom, food menu, and upcoming events."
    ]
  },
  beer_release: {
    headlines: [
      "New Release at Uncommon Path",
      "See What Is Pouring Today",
      "Visit Our Fort Lauderdale Taproom"
    ],
    descriptions: [
      "Explore new releases, the kitchen menu, and the taproom experience.",
      "Use alcohol-safe targeting and review rules before publishing."
    ]
  },
  mixed: {
    headlines: [
      "Taproom, Pizza & Private Events",
      "Lunch, Events & Local Brewery",
      "Visit Uncommon Path in Fort Lauderdale"
    ],
    descriptions: [
      "Draft ads with built-in checks for landing page, copy, and Google validation.",
      "Create safer local campaigns for events, lunch, and brewery branding."
    ]
  }
} as const;

const defaultDraft: AdDraft = {
  businessName: "Uncommon Path Brewing",
  campaignMode: "food",
  countryCode: "US",
  finalUrl: "https://uncommonpathbrewing.com",
  audienceType: "none",
  headlines: templates.food.headlines,
  descriptions: templates.food.descriptions,
  notes: ""
};

export default function Page() {
  const [draft, setDraft] = useState<AdDraft>(defaultDraft);
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const riskClass = useMemo(() => {
    if (!review) return "status-warn";
    if (review.recommendation === "ready") return "status-good";
    if (review.recommendation === "blocked") return "status-bad";
    return "status-warn";
  }, [review]);

  const onChange = <K extends keyof AdDraft>(key: K, value: AdDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateArrayValue = (
    key: "headlines" | "descriptions",
    index: number,
    value: string
  ) => {
    setDraft((current) => {
      const clone = [...current[key]];
      clone[index] = value;
      return { ...current, [key]: clone };
    });
  };

  const addRow = (key: "headlines" | "descriptions") => {
    setDraft((current) => ({ ...current, [key]: [...current[key], ""] }));
  };

  const applyTemplate = (mode: AdDraft["campaignMode"]) => {
    setDraft((current) => ({
      ...current,
      campaignMode: mode,
      headlines: [...templates[mode].headlines],
      descriptions: [...templates[mode].descriptions]
    }));
  };

  const runReview = async (runGoogleValidation: boolean) => {
    setLoading(true);
    setReview(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ draft, runGoogleValidation })
      });

      const data = (await response.json()) as ReviewResponse | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Review failed.");
      }

      setReview(data);
    } catch (error) {
      setReview({
        score: 0,
        recommendation: "blocked",
        issues: [
          {
            severity: "block",
            code: "REQUEST_FAILED",
            message: error instanceof Error ? error.message : "Unknown request failure."
          }
        ],
        googleValidation: {
          attempted: false,
          status: "failed",
          message: "Request to local review API failed."
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="shell">
        <header className="hero">
          <p className="kicker">Google Ads policy guard</p>
          <h1>Build safer local ads before they hit review</h1>
          <p>
            This starter GUI is designed for restaurant-first and brewery-brand campaigns.
            It does not try to bypass policy. It scores risky copy, scans the landing page,
            blocks obvious audience mistakes, and can run a Google Ads validate-only call
            when credentials are configured.
          </p>
        </header>

        <div className="grid">
          <section className="card">
            <h2 className="sectionTitle">Campaign draft</h2>

            <div className="fieldGrid">
              <div className="field">
                <label>Business name</label>
                <input
                  value={draft.businessName}
                  onChange={(event) => onChange("businessName", event.target.value)}
                />
              </div>

              <div className="field">
                <label>Campaign mode</label>
                <select
                  value={draft.campaignMode}
                  onChange={(event) =>
                    onChange("campaignMode", event.target.value as AdDraft["campaignMode"])
                  }
                >
                  <option value="food">Food / Pizza / Lunch / Private Events</option>
                  <option value="brewery_brand">Brewery Brand / Taproom</option>
                  <option value="beer_release">Beer Release / Beer Menu</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="field">
                <label>Country code</label>
                <input
                  value={draft.countryCode}
                  onChange={(event) => onChange("countryCode", event.target.value.toUpperCase())}
                />
              </div>

              <div className="field">
                <label>Audience type</label>
                <select
                  value={draft.audienceType}
                  onChange={(event) =>
                    onChange("audienceType", event.target.value as AdDraft["audienceType"])
                  }
                >
                  <option value="none">No audience applied</option>
                  <option value="google_predefined">Predefined Google audience</option>
                  <option value="customer_match">Customer Match</option>
                  <option value="remarketing">Remarketing</option>
                  <option value="custom_segment">Custom segment</option>
                </select>
              </div>

              <div className="field full">
                <label>Final URL</label>
                <input
                  value={draft.finalUrl}
                  onChange={(event) => onChange("finalUrl", event.target.value)}
                />
              </div>

              <div className="field full">
                <label>Quick templates</label>
                <div className="templateRow">
                  <button className="templateButton" onClick={() => applyTemplate("food")}>
                    Food-safe
                  </button>
                  <button
                    className="templateButton"
                    onClick={() => applyTemplate("brewery_brand")}
                  >
                    Brewery brand
                  </button>
                  <button
                    className="templateButton"
                    onClick={() => applyTemplate("beer_release")}
                  >
                    Beer release
                  </button>
                  <button className="templateButton" onClick={() => applyTemplate("mixed")}>
                    Mixed
                  </button>
                </div>
              </div>
            </div>

            <div className="field">
              <label>Headlines</label>
              <div className="arrayField">
                {draft.headlines.map((value, index) => (
                  <textarea
                    key={`headline-${index}`}
                    className="small"
                    value={value}
                    onChange={(event) => updateArrayValue("headlines", index, event.target.value)}
                    placeholder={`Headline ${index + 1}`}
                  />
                ))}
              </div>
              <div className="inlineButtons">
                <button className="ghost" onClick={() => addRow("headlines")}>
                  Add headline
                </button>
              </div>
            </div>

            <div className="field">
              <label>Descriptions</label>
              <div className="arrayField">
                {draft.descriptions.map((value, index) => (
                  <textarea
                    key={`description-${index}`}
                    className="small"
                    value={value}
                    onChange={(event) =>
                      updateArrayValue("descriptions", index, event.target.value)
                    }
                    placeholder={`Description ${index + 1}`}
                  />
                ))}
              </div>
              <div className="inlineButtons">
                <button className="ghost" onClick={() => addRow("descriptions")}>
                  Add description
                </button>
              </div>
            </div>

            <div className="field">
              <label>Internal notes</label>
              <textarea
                value={draft.notes ?? ""}
                onChange={(event) => onChange("notes", event.target.value)}
                placeholder="Example: push this to lunch-safe landing page instead of beer menu."
              />
            </div>

            <div className="actions">
              <button
                className="secondary"
                onClick={() => runReview(false)}
                disabled={loading}
              >
                {loading ? "Reviewing..." : "Run local review"}
              </button>
              <button className="primary" onClick={() => runReview(true)} disabled={loading}>
                {loading ? "Checking..." : "Run review + Google validate"}
              </button>
            </div>
          </section>

          <aside className="resultStack">
            <section className="card">
              <h2 className="sectionTitle">Review summary</h2>
              <div className="metric">
                <span className="subtle">Risk score</span>
                <span className={`metricValue ${riskClass}`}>
                  {review ? review.score : "—"}
                </span>
              </div>
              <p className={`muted ${riskClass}`}>
                {review
                  ? review.recommendation === "ready"
                    ? "Looks usable as drafted, but still requires platform approval."
                    : review.recommendation === "needs_review"
                      ? "Usable after edits. Review warnings before publishing."
                      : "Blocked by local rules. Fix these items before submission."
                  : "Run a review to score your draft and inspect the landing page."}
              </p>

              <div className="pillRow">
                <span className="pill">Mode: {draft.campaignMode}</span>
                <span className="pill">Audience: {draft.audienceType}</span>
                <span className="pill">Country: {draft.countryCode}</span>
              </div>
            </section>

            <section className="card">
              <h2 className="sectionTitle">Issues</h2>
              {review?.issues?.length ? (
                <ul className="list">
                  {review.issues.map((issue) => (
                    <li key={`${issue.code}-${issue.message}`}>
                      <strong>[{issue.severity.toUpperCase()}]</strong> {issue.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No issues yet.</p>
              )}
            </section>

            <section className="card">
              <h2 className="sectionTitle">Landing page scan</h2>
              {review?.landingScan ? (
                <div className="resultStack">
                  <div>
                    <div className="subtle">Title</div>
                    <div>{review.landingScan.title || "No title found"}</div>
                  </div>
                  <div>
                    <div className="subtle">Alcohol terms found</div>
                    <div>{review.landingScan.alcoholTermsFound.join(", ") || "None"}</div>
                  </div>
                  <div>
                    <div className="subtle">Food/event terms found</div>
                    <div>{review.landingScan.foodTermsFound.join(", ") || "None"}</div>
                  </div>
                  <div>
                    <div className="subtle">Headings</div>
                    <pre className="codeBlock">
                      {review.landingScan.headings.join("\n") || "No headings found"}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="muted">No landing page scan yet.</p>
              )}
            </section>

            <section className="card">
              <h2 className="sectionTitle">Google validation</h2>
              {review ? (
                <div className="resultStack">
                  <p className="muted">{review.googleValidation.message}</p>
                  {review.googleValidation.details?.length ? (
                    <ul className="list">
                      {review.googleValidation.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <p className="muted">
                  Configure env vars and wire a real campaign/ad group to use validate-only mode.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
