"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push("/dashboard");
      return;
    }

    router.push("/login");
  }, [router]);

  return (
    <div className="app-page flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[rgb(var(--app-text-primary))]">
          Carregando...
        </h1>
      </div>
    </div>
  );
}
