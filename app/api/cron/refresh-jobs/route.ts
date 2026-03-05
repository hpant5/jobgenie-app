import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Protect cron endpoint
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const { error, count } = await supabase
      .from("jobs_cache")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());

    if (error) {
      return NextResponse.json({ error: "Failed to clean cache" }, { status: 500 });
    }

    return NextResponse.json({
      message: `Cleaned ${count ?? 0} expired jobs from cache`,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}