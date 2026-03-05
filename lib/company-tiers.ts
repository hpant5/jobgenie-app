import type { CompanyTier } from "@/types/job";

// FAANG + tier-1 big tech
const FAANG: string[] = [
  "google", "meta", "apple", "amazon", "netflix", "microsoft",
  "alphabet", "facebook", "instagram", "whatsapp",
];

const TIER1_TECH: string[] = [
  "nvidia", "salesforce", "adobe", "oracle", "ibm", "intel",
  "uber", "airbnb", "lyft", "twitter", "x corp", "linkedin",
  "stripe", "square", "block", "paypal", "shopify", "atlassian",
  "workday", "servicenow", "snowflake", "databricks", "palantir",
  "openai", "anthropic", "deepmind", "tesla", "spacex",
];

const MID_SIZE: string[] = [
  "hubspot", "zendesk", "twilio", "okta", "cloudflare", "hashicorp",
  "mongodb", "elastic", "confluent", "datadog", "new relic", "splunk",
  "pagerduty", "gitlab", "github", "figma", "notion", "airtable",
  "asana", "monday.com", "clickup", "zoom", "slack", "dropbox",
  "box", "docusign", "veeva", "coupa", "medallia",
];

export function getCompanyTier(companyName: string): CompanyTier {
  const lower = companyName.toLowerCase();

  if (FAANG.some((f) => lower.includes(f))) return "faang";
  if (TIER1_TECH.some((t) => lower.includes(t))) return "faang"; // group with faang in UI
  if (MID_SIZE.some((m) => lower.includes(m))) return "mid";

  // Heuristic: if company name is well-known but not in lists → mid
  // Everything else → small/startup (default)
  return "small";
}