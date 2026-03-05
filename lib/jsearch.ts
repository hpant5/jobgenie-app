import type { Job, JobFilters } from "@/types/job";

const JSEARCH_BASE = "https://jsearch.p.rapidapi.com";

const headers = {
  "X-RapidAPI-Key": process.env.JSEARCH_API_KEY!,
  "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
};

type JSearchJob = {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_is_remote: boolean;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_description: string;
  job_required_skills: string[] | null;
  job_required_experience: { required_experience_in_months: number | null } | null;
  job_apply_link: string;
  job_posted_at_timestamp: number;
  job_employment_type: string;
  job_highlights: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  } | null;
};

function normalizeJob(raw: JSearchJob): Omit<Job, "id" | "company_tier" | "fetched_at" | "expires_at"> {
  const location = [raw.job_city, raw.job_state, raw.job_country]
    .filter(Boolean)
    .join(", ");

  return {
    source_id: raw.job_id,
    title: raw.job_title,
    company: raw.employer_name,
    location: location || null,
    is_remote: raw.job_is_remote,
    salary_min: raw.job_min_salary ?? null,
    salary_max: raw.job_max_salary ?? null,
    salary_currency: raw.job_salary_currency ?? "USD",
    description: raw.job_description,
    requirements: raw.job_highlights?.Qualifications ?? raw.job_required_skills ?? null,
    tech_stack: raw.job_required_skills ?? null,
    visa_sponsored: null,       // JSearch doesn't expose this — we handle via filtering
    apply_url: raw.job_apply_link,
    source: "jsearch",
  };
}

export async function fetchJobsFromJSearch(
  filters: JobFilters,
  page: number = 1
): Promise<Omit<Job, "id" | "company_tier" | "fetched_at" | "expires_at">[]> {
  // Build query string from filters
  const queryParts: string[] = ["software engineer", "developer", "engineer"];

  if (filters.query) queryParts.unshift(filters.query);
  if (filters.tech_stack?.length) queryParts.push(...filters.tech_stack.slice(0, 2));

  const query = queryParts.slice(0, 3).join(" ");

  const params = new URLSearchParams({
    query,
    page: String(page),
    num_pages: "1",
    date_posted: "week",
  });

  if (filters.locations?.length && !filters.is_remote) {
    params.set("location", filters.locations[0]);
    params.set("distance", "50");
  }

  if (filters.is_remote) {
    params.set("remote_jobs_only", "true");
  }

  if (filters.employment_type?.length) {
    // JSearch accepts: FULLTIME, PARTTIME, CONTRACTOR, INTERN
    const typeMap: Record<string, string> = {
      "full-time": "FULLTIME",
      "part-time": "PARTTIME",
      "contract": "CONTRACTOR",
    };
    const mapped = filters.employment_type
      .map((t) => typeMap[t])
      .filter(Boolean);
    if (mapped.length) params.set("employment_types", mapped.join(","));
  }

  const url = `${JSEARCH_BASE}/search?${params.toString()}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`JSearch API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.data || !Array.isArray(data.data)) return [];

  return data.data.map(normalizeJob);
}