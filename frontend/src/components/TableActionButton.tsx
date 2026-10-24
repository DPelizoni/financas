"use client";

import { Eye, Pencil, Trash2, UserX } from "lucide-react";

interface TableActionButtonProps {
  action: "view" | "edit" | "delete" | "deactivate";
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
      icon: Eye,
      toneClass: "app-action-view",
    },
    edit: {
      icon: Pencil,
      toneClass: "app-action-edit",
    },
    delete: {
      icon: Trash2,
      toneClass: "app-action-delete",
    },
    deactivate: {
      icon: UserX,
      toneClass: "app-action-deactivate",
    },
  }[action];
  const { toneClass, icon: ActionIcon } = actionConfig;

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${
        compact ? "h-8 w-8" : "h-10 w-10"
      }`}
    >
      <ActionIcon size={compact ? 16 : 20} />
    </button>
  );
}
