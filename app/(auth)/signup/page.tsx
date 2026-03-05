"use client";

import { useState } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function SignupPage() {
  const [done, setDone] = useState(false);

  async function handleSignup(data: {
    email: string;
    password: string;
    full_name?: string;
  }) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.error);

    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm">
            We sent you a confirmation link. Click it to activate your account and get started.
          </p>
        </div>
      </div>
    );
  }

  return <AuthForm mode="signup" onSubmit={handleSignup} />;
}