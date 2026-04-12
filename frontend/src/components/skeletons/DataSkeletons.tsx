"use client";

import React from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full animate-pulse overflow-hidden rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/40">
      {hasHeader && (
        <div className="flex border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={`header-${i}`}
              className="mr-4 h-4 rounded bg-slate-200 dark:bg-slate-800"
              style={{ width: `${100 / columns - 2}%` }}
            />
          ))}
        </div>
      )}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex items-center p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`col-${rowIndex}-${colIndex}`}
                className="mr-4 h-3 rounded bg-slate-100 dark:bg-slate-800/60"
                style={{ width: `${100 / columns - 2}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`card-${i}`}
          className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-1/4 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
          <div className="mt-4 h-12 w-full rounded-lg bg-slate-50 dark:bg-slate-800/30" />
        </div>
      ))}
    </div>
  );
}
