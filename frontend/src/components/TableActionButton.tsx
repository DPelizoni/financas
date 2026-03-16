"use client";

import Icon from "@mdi/react";
import { mdiPencilBoxOutline, mdiTrashCanOutline } from "@mdi/js";

interface TableActionButtonProps {
  action: "edit" | "delete";
  title: string;
  onClick: () => void;
  compact?: boolean;
}

export default function TableActionButton({
  action,
  title,
  onClick,
  compact = false,
}: TableActionButtonProps) {
  const isEdit = action === "edit";
  const iconPath = isEdit ? mdiPencilBoxOutline : mdiTrashCanOutline;
  const toneClass = isEdit
    ? "text-blue-600 hover:bg-blue-50 hover:text-blue-800"
    : "text-red-600 hover:bg-red-50 hover:text-red-800";

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md transition ${toneClass} ${
        compact ? "h-8 w-8" : "h-10 w-10"
      }`}
    >
      <Icon path={iconPath} size={compact ? 0.95 : 1.1} />
    </button>
  );
}
