"use client";

import Icon from "@mdi/react";
import {
  mdiAccountOffOutline,
  mdiEyeOutline,
  mdiFileEditOutline,
  mdiTrashCanOutline,
} from "@mdi/js";

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
      iconPath: mdiEyeOutline,
      toneClass: "app-action-view",
    },
    edit: {
      iconPath: mdiFileEditOutline,
      toneClass: "app-action-edit",
    },
    delete: {
      iconPath: mdiTrashCanOutline,
      toneClass: "app-action-delete",
    },
    deactivate: {
      iconPath: mdiAccountOffOutline,
      toneClass: "app-action-deactivate",
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
