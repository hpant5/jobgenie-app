export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  onboarding_done: boolean;
  active_resume: string | null;
  created_at: string;
  updated_at: string;
};

export type Preferences = {
  id: string;
  user_id: string;
  job_titles: string[];
  locations: string[];
  salary_min: number | null;
  salary_max: number | null;
  years_exp_min: number | null;
  years_exp_max: number | null;
  visa_required: boolean;
  tech_stack: string[];
  company_sizes: CompanySize[];
  employment_type: EmploymentType[];
  updated_at: string;
};

export type CompanySize = "faang" | "mid" | "small" | "startup";
export type EmploymentType = "full-time" | "part-time" | "contract" | "remote";