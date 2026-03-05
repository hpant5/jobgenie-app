import { createClient } from "@/lib/supabase/server";
import { fetchJobsFromJSearch } from "@/lib/jsearch";
import { getCompanyTier } from "@/lib/company-tiers";
import { NextResponse } from "next/server";
// import type { JobFilters } from "@/types/job";
import type { JobFilters, Job } from "@/types/job";
const CACHE_TTL_HOURS = 12;
type NormalizedJob = Omit<Job, "id" | "company_tier" | "fetched_at" | "expires_at">;
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse filters from query params
    const { searchParams } = new URL(request.url);

    const filters: JobFilters = {
      query: searchParams.get("query") ?? undefined,
      is_remote: searchParams.get("is_remote") === "true" ? true : undefined,
      salary_min: searchParams.get("salary_min") ? Number(searchParams.get("salary_min")) : undefined,
      salary_max: searchParams.get("salary_max") ? Number(searchParams.get("salary_max")) : undefined,
      visa_required: searchParams.get("visa_required") === "true" ? true : undefined,
      locations: searchParams.get("locations")?.split(",").filter(Boolean) ?? undefined,
      tech_stack: searchParams.get("tech_stack")?.split(",").filter(Boolean) ?? undefined,
      company_sizes: searchParams.get("company_sizes")?.split(",").filter(Boolean) as JobFilters["company_sizes"] ?? undefined,
      employment_type: searchParams.get("employment_type")?.split(",").filter(Boolean) ?? undefined,
    };

    const page = Number(searchParams.get("page") ?? "1");

    // ── 1. Try cache first ──────────────────────────────────────────────────
    let query = supabase
      .from("jobs_cache")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("fetched_at", { ascending: false })
      .range((page - 1) * 20, page * 20 - 1);

    if (filters.is_remote) query = query.eq("is_remote", true);
    if (filters.salary_min) query = query.gte("salary_min", filters.salary_min);
    if (filters.salary_max) query = query.lte("salary_max", filters.salary_max);
    if (filters.company_sizes?.length) query = query.in("company_tier", filters.company_sizes);

    const { data: cachedJobs } = await query;

    if (cachedJobs && cachedJobs.length >= 10) {
      return NextResponse.json({ jobs: cachedJobs, source: "cache" });
    }

    // ── 2. Cache miss — fetch from JSearch ─────────────────────────────────
    const freshJobs = await fetchJobsFromJSearch(filters, page);

    if (!freshJobs.length) {
      return NextResponse.json({ jobs: cachedJobs ?? [], source: "cache" });
    }

    // ── 3. Enrich with company tier + upsert to cache ──────────────────────
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

const jobsToUpsert = freshJobs.map((job: NormalizedJob) => ({
      ...job,
      company_tier: getCompanyTier(job.company),
      expires_at: expiresAt.toISOString(),
    }));

    const { data: upsertedJobs, error: upsertError } = await supabase
      .from("jobs_cache")
      .upsert(jobsToUpsert, { onConflict: "source_id" })
      .select();

    if (upsertError) {
      console.error("Cache upsert error:", upsertError);
      // Still return the fresh jobs even if cache fails
      return NextResponse.json({ jobs: freshJobs, source: "live" });
    }

    return NextResponse.json({ jobs: upsertedJobs, source: "live" });
  } catch (err) {
    console.error("Job search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}