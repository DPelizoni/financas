"use client";

import Icon from "@mdi/react";
import { mdiEyeOutline, mdiFileEditOutline, mdiTrashCanOutline } from "@mdi/js";

interface TableActionButtonProps {
  action: "view" | "edit" | "delete";
  title: string;
  onClick: () => void;
  compact?: boolean;
  disabled?: boolean;
}

export default function TableActionButton({
  action,
  title,
  onClick,
  compact = false,
  disabled = false,
}: TableActionButtonProps) {
  const actionConfig = {
    view: {
      iconPath: mdiEyeOutline,
      toneClass: "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
    },
    edit: {
      iconPath: mdiFileEditOutline,
      toneClass: "text-blue-600 hover:bg-blue-50 hover:text-blue-800",
    },
    delete: {
      iconPath: mdiTrashCanOutline,
      toneClass: "text-red-600 hover:bg-red-50 hover:text-red-800",
    },
  }[action];
  const { toneClass } = actionConfig;

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${
        compact ? "h-8 w-8" : "h-10 w-10"
      }`}
    >
      <Icon path={actionConfig.iconPath} size={compact ? 0.95 : 1.1} />
    </button>
  );
}
