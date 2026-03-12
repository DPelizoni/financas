"use client";

import { authService } from "@/services/authService";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!authService.isAuthenticated()) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        await authService.me();
        setChecking(false);
      } catch {
        authService.clearStoredSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    verifyAuth();
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-lg bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Validando sessão...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
