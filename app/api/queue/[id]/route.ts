import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH — update status or notes
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const allowedFields = ["status", "notes", "custom_resume", "applied_at"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (body.status === "applied" && !body.applied_at) {
      updates.applied_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("job_queue")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id) // RLS + explicit check
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove from queue
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from("job_queue")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete queue item" }, { status: 500 });
    }

    return NextResponse.json({ message: "Removed from queue" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}