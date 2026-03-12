"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";

interface AppLayoutProps {
  children: React.ReactNode;
}

const isPublicRoute = (pathname: string): boolean => {
  return pathname.startsWith("/login") || pathname.startsWith("/register");
};

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
