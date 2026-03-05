import Anthropic from "@anthropic-ai/sdk";
import type { ScoreBreakdown, Suggestion, ResumeCustomizationResult } from "@/types/resume";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── Resume Scoring (Haiku — fast + cheap) ───────────────────────────────────
export async function scoreResume(resumeText: string): Promise<{
  score: number;
  breakdown: ScoreBreakdown;
  suggestions: Suggestion[];
}> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert ATS resume analyzer. Analyze this resume and return ONLY a JSON object with no extra text or markdown.

Resume:
${resumeText}

Return this exact JSON structure:
{
  "score": <overall 1-10 integer>,
  "breakdown": {
    "keywords": <0-10 integer>,
    "format": <0-10 integer>,
    "experience": <0-10 integer>,
    "impact": <0-10 integer>
  },
  "suggestions": [
    {
      "category": <"keywords"|"format"|"experience"|"impact">,
      "priority": <"high"|"medium"|"low">,
      "text": <specific actionable suggestion string>
    }
  ]
}

Scoring guide:
- keywords: ATS keyword density, industry terms, tech stack mentions
- format: structure, readability, section organization, length
- experience: relevance and clarity of work history
- impact: quantified achievements, action verbs, measurable results
- overall score: weighted average (keywords 30%, impact 30%, experience 25%, format 15%)
- suggestions: minimum 3, maximum 8, ordered by priority`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(text.trim());

  return {
    score: parsed.score,
    breakdown: parsed.breakdown,
    suggestions: parsed.suggestions,
  };
}

// ─── Resume Customization (Sonnet — quality generation) ──────────────────────
export async function customizeResume(
  resumeText: string,
  jobTitle: string,
  jobDescription: string
): Promise<ResumeCustomizationResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert resume writer. Your job is to tailor a resume for a specific job posting.

Job Title: ${jobTitle}
Job Description:
${jobDescription}

Current Resume:
${resumeText}

Analyze the job description and rewrite the resume to maximize ATS match. Return ONLY a JSON object with no extra text or markdown.

Return this exact JSON structure:
{
  "rewritten_sections": [
    {
      "section": <section name e.g. "Summary", "Experience - Company Name", "Skills">,
      "original": <original section text>,
      "rewritten": <rewritten section text with keywords naturally incorporated>
    }
  ],
  "added_keywords": [<list of keywords added from the JD>],
  "score_before": <estimated score 1-10 before customization>,
  "score_after": <estimated score 1-10 after customization>,
  "suggestions": [
    {
      "category": <"keywords"|"format"|"experience"|"impact">,
      "priority": <"high"|"medium"|"low">,
      "text": <suggestion string>
    }
  ]
}

Rules:
- Only rewrite sections that genuinely benefit from changes
- Never fabricate experience or skills the candidate does not have
- Naturally incorporate keywords — do not keyword stuff
- Keep the same honest facts, just better framed
- Prioritize the top 10 keywords from the job description`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.trim());
}

// ─── Extract keywords from JD (Haiku — simple extraction) ────────────────────
export async function extractJobKeywords(jobDescription: string): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Extract the top technical keywords and requirements from this job description. Return ONLY a JSON array of strings, no extra text.

Job Description:
${jobDescription}

Return format: ["keyword1", "keyword2", ...]

Focus on: programming languages, frameworks, tools, methodologies, certifications, and must-have skills.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.trim());
}