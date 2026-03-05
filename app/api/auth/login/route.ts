import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Check if onboarding is done to decide where to redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_done")
      .eq("id", data.user.id)
      .single();

    const redirectTo = profile?.onboarding_done
      ? "/dashboard/search"
      : "/dashboard/onboarding";

    return NextResponse.json({
      user: data.user,
      redirectTo,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}