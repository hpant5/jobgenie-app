export type Job = {
  id: string;
  source_id: string;
  title: string;
  company: string;
  company_tier: CompanyTier | null;
  location: string | null;
  is_remote: boolean | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  description: string | null;
  requirements: string[] | null;
  tech_stack: string[] | null;
  visa_sponsored: boolean | null;
  apply_url: string;
  source: string | null;
  fetched_at: string;
  expires_at: string | null;
};

export type CompanyTier = "faang" | "mid" | "small" | "startup";

export type JobFilters = {
  query?: string;
  locations?: string[];
  is_remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  years_exp_min?: number;
  years_exp_max?: number;
  visa_required?: boolean;
  tech_stack?: string[];
  company_sizes?: CompanyTier[];
  employment_type?: string[];
};

export type QueueStatus = "saved" | "applied" | "rejected";

export type QueueItem = {
  id: string;
  user_id: string;
  job_id: string;
  status: QueueStatus;
  custom_resume: string | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  job?: Job;
};