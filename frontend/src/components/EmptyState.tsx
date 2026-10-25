"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import AppButton from "@/components/AppButton";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="mb-6 rounded-lg bg-neutral-50 p-6 text-neutral-300 dark:bg-slate-900/40 dark:text-slate-700">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-8 max-w-xs text-sm text-app-text-muted dark:text-slate-400">
        {description}
      </p>
      {actionLabel && onAction && (
        <AppButton
          onClick={onAction}
          tone="primary"
          size="sm"
          className="shadow-md"
        >
          {actionLabel}
        </AppButton>
      )}
    </div>
  );
}
