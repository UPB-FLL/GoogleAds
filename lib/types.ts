export type CampaignMode =
  | "food"
  | "brewery_brand"
  | "beer_release"
  | "mixed";

export type AudienceType =
  | "none"
  | "google_predefined"
  | "customer_match"
  | "remarketing"
  | "custom_segment";

export interface AdDraft {
  businessName: string;
  campaignMode: CampaignMode;
  countryCode: string;
  finalUrl: string;
  audienceType: AudienceType;
  headlines: string[];
  descriptions: string[];
  notes?: string;
}

export interface RuleIssue {
  severity: "block" | "warn" | "info";
  code: string;
  message: string;
}

export interface LandingScanResult {
  title?: string;
  headings: string[];
  alcoholTermsFound: string[];
  foodTermsFound: string[];
  imageHints: string[];
  notes: string[];
}

export interface ReviewResponse {
  score: number;
  recommendation: "ready" | "needs_review" | "blocked";
  issues: RuleIssue[];
  landingScan?: LandingScanResult;
  googleValidation: {
    attempted: boolean;
    status: "not_configured" | "validated" | "failed" | "skipped";
    message: string;
    details?: string[];
  };
}
