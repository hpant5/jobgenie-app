import { createClient } from "@/lib/supabase/server";
import { extractTextFromPDF } from "@/lib/pdf";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    // Convert to buffer and extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsedText = await extractTextFromPDF(buffer);

    if (!parsedText || parsedText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. Please ensure it is not a scanned image." },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    // Save resume record to DB
    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_url: publicUrl,
        parsed_text: parsedText,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
    }

    // Set as active resume on profile
    await supabase
      .from("profiles")
      .update({ active_resume: resume.id })
      .eq("id", user.id);

    return NextResponse.json({
      message: "Resume uploaded successfully",
      resume: {
        id: resume.id,
        file_url: resume.file_url,
        created_at: resume.created_at,
      },
    });
  } catch (err) {
    console.error("Resume upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}