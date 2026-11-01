"use client";

import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import AppButton from "@/components/AppButton";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = "Não foi possível carregar os dados",
  description = "Verifique sua conexão e tente novamente.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      <div className="app-badge-error mb-6 rounded-lg p-6">
        <AlertTriangle size={48} strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-8 max-w-xs text-sm text-app-text-muted dark:text-slate-400">
        {description}
      </p>
      {onRetry && (
        <AppButton
          onClick={onRetry}
          tone="primary"
          size="sm"
          className="shadow-md"
          startIcon={<RotateCw size={16} />}
        >
          Tentar novamente
        </AppButton>
      )}
    </div>
  );
}
