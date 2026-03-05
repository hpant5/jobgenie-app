import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — fetch user preferences
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
    }

    return NextResponse.json({ preferences: data ?? null });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — create or update preferences (upsert)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const preferences = {
      user_id: user.id,
      job_titles: body.job_titles ?? [],
      locations: body.locations ?? [],
      salary_min: body.salary_min ?? null,
      salary_max: body.salary_max ?? null,
      years_exp_min: body.years_exp_min ?? null,
      years_exp_max: body.years_exp_max ?? null,
      visa_required: body.visa_required ?? false,
      tech_stack: body.tech_stack ?? [],
      company_sizes: body.company_sizes ?? [],
      employment_type: body.employment_type ?? [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("preferences")
      .upsert(preferences, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
    }

    // Mark onboarding done if not already
    await supabase
      .from("profiles")
      .update({ onboarding_done: true })
      .eq("id", user.id)
      .eq("onboarding_done", false);

    return NextResponse.json({ preferences: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}