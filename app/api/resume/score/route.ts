import { createClient } from "@/lib/supabase/server";
import { scoreResume } from "@/lib/claude";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resume_id } = await request.json();

    if (!resume_id) {
      return NextResponse.json({ error: "resume_id is required" }, { status: 400 });
    }

    // Fetch resume — RLS ensures user can only access their own
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, parsed_text")
      .eq("id", resume_id)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (!resume.parsed_text) {
      return NextResponse.json({ error: "Resume has no parsed text" }, { status: 400 });
    }

    // Score with Claude Haiku
    const { score, breakdown, suggestions } = await scoreResume(resume.parsed_text);

    // Save score back to DB
    await supabase
      .from("resumes")
      .update({ score, score_breakdown: breakdown, suggestions })
      .eq("id", resume_id);

    return NextResponse.json({ score, breakdown, suggestions });
  } catch (err) {
    console.error("Resume score error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}