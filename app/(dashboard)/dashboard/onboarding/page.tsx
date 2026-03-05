"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PreferencesData = {
  job_titles: string[];
  locations: string[];
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  years_exp_min: number | null;
  years_exp_max: number | null;
  visa_required: boolean;
  tech_stack: string[];
  company_sizes: string[];
  employment_type: string[];
};

const STEPS = ["Job Titles", "Location", "Salary & Exp", "Stack & Preferences"];

const COMPANY_SIZE_OPTIONS = [
  { value: "faang", label: "FAANG / Tier-1", desc: "Google, Meta, Apple, Microsoft..." },
  { value: "mid", label: "Mid-size", desc: "Stripe, Shopify, Cloudflare..." },
  { value: "small", label: "Small / Growth", desc: "Series A/B startups" },
  { value: "startup", label: "Early Startup", desc: "Seed / pre-seed" },
];

const EMPLOYMENT_OPTIONS = ["full-time", "part-time", "contract", "remote"];

const POPULAR_STACKS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js",
  "Go", "Java", "Rust", "AWS", "GCP", "Azure", "Docker",
  "Kubernetes", "PostgreSQL", "MongoDB", "Redis", "GraphQL",
];

const POPULAR_TITLES = [
  "Software Engineer", "Senior Software Engineer", "Full Stack Engineer",
  "Backend Engineer", "Frontend Engineer", "Staff Engineer",
  "Engineering Manager", "Data Engineer", "ML Engineer", "DevOps Engineer",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<PreferencesData>({
    job_titles: [],
    locations: [],
    is_remote: false,
    salary_min: null,
    salary_max: null,
    years_exp_min: null,
    years_exp_max: null,
    visa_required: false,
    tech_stack: [],
    company_sizes: [],
    employment_type: ["full-time"],
  });

  const [titleInput, setTitleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [stackInput, setStackInput] = useState("");

  function addTag(field: "job_titles" | "locations" | "tech_stack", value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (data[field].includes(trimmed)) return;
    setData((prev) => ({ ...prev, [field]: [...prev[field], trimmed] }));
  }

  function removeTag(field: "job_titles" | "locations" | "tech_stack", value: string) {
    setData((prev) => ({ ...prev, [field]: prev[field].filter((v) => v !== value) }));
  }

  function toggleArrayValue(field: "company_sizes" | "employment_type", value: string) {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      router.push("/dashboard/search");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function canProceed() {
    if (step === 0) return data.job_titles.length > 0;
    if (step === 1) return data.locations.length > 0 || data.is_remote;
    if (step === 2) return true;
    return data.tech_stack.length > 0 && data.company_sizes.length > 0;
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Set up your job search</h1>
        <p className="text-gray-500 text-sm mt-1">
          This helps us find the right jobs for you. You can change these anytime.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                i < step ? "bg-blue-600 text-white" :
                i === step ? "bg-blue-600 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                i === step ? "text-blue-600" : "text-gray-400"
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        {/* Step 0 — Job Titles */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">What roles are you targeting?</h2>
            <p className="text-sm text-gray-500 mb-4">Add one or more job titles you want to search for.</p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTag("job_titles", titleInput);
                    setTitleInput("");
                  }
                }}
                placeholder="e.g. Senior Software Engineer"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => { addTag("job_titles", titleInput); setTitleInput(""); }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            {/* Tags */}
            {data.job_titles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {data.job_titles.map((t) => (
                  <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                    {t}
                    <button onClick={() => removeTag("job_titles", t)} className="hover:text-blue-900 ml-1">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Popular titles</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TITLES.filter((t) => !data.job_titles.includes(t)).slice(0, 6).map((t) => (
                  <button
                    key={t}
                    onClick={() => addTag("job_titles", t)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Location */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Where do you want to work?</h2>
            <p className="text-sm text-gray-500 mb-4">Add cities or regions, or select remote only.</p>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 mb-4">
              <input
                type="checkbox"
                checked={data.is_remote}
                onChange={(e) => setData((prev) => ({ ...prev, is_remote: e.target.checked }))}
                className="w-4 h-4 accent-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Remote only</p>
                <p className="text-xs text-gray-500">Show only fully remote positions</p>
              </div>
            </label>

            {!data.is_remote && (
              <>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addTag("locations", locationInput);
                        setLocationInput("");
                      }
                    }}
                    placeholder="e.g. San Francisco, CA"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => { addTag("locations", locationInput); setLocationInput(""); }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>

                {data.locations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.locations.map((l) => (
                      <span key={l} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                        {l}
                        <button onClick={() => removeTag("locations", l)} className="hover:text-blue-900 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2 — Salary + Exp */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Salary & Experience</h2>
            <p className="text-sm text-gray-500 mb-4">These help us filter out irrelevant jobs. All optional.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary range (USD/year)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min e.g. 80000"
                    value={data.salary_min ?? ""}
                    onChange={(e) => setData((prev) => ({ ...prev, salary_min: e.target.value ? Number(e.target.value) : null }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="number"
                    placeholder="Max e.g. 150000"
                    value={data.salary_max ?? ""}
                    onChange={(e) => setData((prev) => ({ ...prev, salary_max: e.target.value ? Number(e.target.value) : null }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of experience
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={data.years_exp_min ?? ""}
                    onChange={(e) => setData((prev) => ({ ...prev, years_exp_min: e.target.value ? Number(e.target.value) : null }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={data.years_exp_max ?? ""}
                    onChange={(e) => setData((prev) => ({ ...prev, years_exp_max: e.target.value ? Number(e.target.value) : null }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400">
                <input
                  type="checkbox"
                  checked={data.visa_required}
                  onChange={(e) => setData((prev) => ({ ...prev, visa_required: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Visa sponsorship required</p>
                  <p className="text-xs text-gray-500">Only show jobs that offer visa sponsorship</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 3 — Stack + Company Size */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Tech stack & company type</h2>
            <p className="text-sm text-gray-500 mb-4">Tell us your stack and what kind of company you want.</p>

            <div className="space-y-5">
              {/* Tech stack */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your tech stack</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={stackInput}
                    onChange={(e) => setStackInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addTag("tech_stack", stackInput);
                        setStackInput("");
                      }
                    }}
                    placeholder="e.g. TypeScript"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => { addTag("tech_stack", stackInput); setStackInput(""); }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {data.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {data.tech_stack.map((t) => (
                      <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                        {t}
                        <button onClick={() => removeTag("tech_stack", t)} className="hover:text-blue-900 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {POPULAR_STACKS.filter((s) => !data.tech_stack.includes(s)).slice(0, 8).map((s) => (
                    <button
                      key={s}
                      onClick={() => addTag("tech_stack", s)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company type</label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleArrayValue("company_sizes", opt.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        data.company_sizes.includes(opt.value)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Employment type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment type</label>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => toggleArrayValue("employment_type", opt)}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        data.employment_type.includes(opt)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {loading ? "Saving..." : "Start searching →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}