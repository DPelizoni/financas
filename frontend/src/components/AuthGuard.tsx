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
      <div className="app-page flex items-center justify-center">
        <div className="app-surface px-6 py-5">
          <p className="text-sm font-medium text-[rgb(var(--app-text-secondary))]">
            Validando sessao...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
