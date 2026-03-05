import { createClient } from "@/lib/supabase/server";
import { customizeResume } from "@/lib/claude";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resume_id, job_id } = await request.json();

    if (!resume_id || !job_id) {
      return NextResponse.json(
        { error: "resume_id and job_id are required" },
        { status: 400 }
      );
    }

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("parsed_text")
      .eq("id", resume_id)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume?.parsed_text) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("jobs_cache")
      .select("title, description")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Customize with Claude Sonnet
    const result = await customizeResume(
      resume.parsed_text,
      job.title,
      job.description ?? ""
    );

    // Save custom resume version to DB
    const { data: customResume, error: saveError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_url: "",           // No file for AI-generated versions
        parsed_text: result.rewritten_sections
          .map((s) => `${s.section}:\n${s.rewritten}`)
          .join("\n\n"),
        score: result.score_after,
        is_custom: true,
        job_id,
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: "Failed to save custom resume" }, { status: 500 });
    }

    return NextResponse.json({
      custom_resume_id: customResume.id,
      result,
    });
  } catch (err) {
    console.error("Resume customize error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}