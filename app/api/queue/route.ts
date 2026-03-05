import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — list user's queue
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // saved | applied | rejected

    let query = supabase
      .from("job_queue")
      .select(`
        *,
        job:jobs_cache (
          id, title, company, company_tier,
          location, is_remote, salary_min, salary_max,
          salary_currency, apply_url, tech_stack
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
    }

    return NextResponse.json({ queue: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — add job to queue
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { job_id, status = "saved" } = await request.json();

    if (!job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("job_queue")
      .insert({ user_id: user.id, job_id, status })
      .select()
      .single();

    if (error) {
      // Unique constraint = already in queue
      if (error.code === "23505") {
        return NextResponse.json({ error: "Job already in queue" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to add to queue" }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}