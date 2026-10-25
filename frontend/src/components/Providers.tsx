"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* Respeita o "reduzir movimento" do sistema nas animações do framer-motion */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster 
        richColors 
        closeButton 
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-app)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
