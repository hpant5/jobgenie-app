export type Resume = {
  id: string;
  user_id: string;
  file_url: string;
  parsed_text: string | null;
  score: number | null;
  score_breakdown: ScoreBreakdown | null;
  suggestions: Suggestion[] | null;
  is_custom: boolean;
  job_id: string | null;
  created_at: string;
};

export type ScoreBreakdown = {
  keywords: number;
  format: number;
  experience: number;
  impact: number;
};

export type Suggestion = {
  category: "keywords" | "format" | "experience" | "impact";
  priority: "high" | "medium" | "low";
  text: string;
};

export type ResumeCustomizationResult = {
  rewritten_sections: RewrittenSection[];
  added_keywords: string[];
  score_before: number;
  score_after: number;
  suggestions: Suggestion[];
};

export type RewrittenSection = {
  section: string;
  original: string;
  rewritten: string;
};