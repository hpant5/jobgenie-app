"use client";

import AuthForm from "@/components/auth/AuthForm";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(data: {
    email: string;
    password: string;
  }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.error);

    router.push(json.redirectTo);
    router.refresh();
  }

  return <AuthForm mode="login" onSubmit={handleLogin} />;
}