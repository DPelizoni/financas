import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface SortableHeaderProps<T extends string> {
  label: string;
  column: T;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: T) => void;
  align?: "left" | "center" | "right";
  className?: string;
}

const alignClass = {
  left: "app-table-head-cell",
  center: "app-table-head-cell-center",
  right: "app-table-head-cell-right",
};

export default function SortableHeader<T extends string>({
  label,
  column,
  sortBy,
  sortDirection,
  onSort,
  align = "left",
  className = "",
}: SortableHeaderProps<T>) {
  const isActive = sortBy === column;
  const ariaSort = isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none";
  const Icon = !isActive ? ArrowUpDown : sortDirection === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={`${alignClass[align]} ${className}`.trim()} aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`group inline-flex items-center gap-1 rounded-sm transition-colors hover:text-[rgb(var(--app-brand-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))] ${
          isActive ? "text-[rgb(var(--app-brand-primary))]" : ""
        }`}
      >
        {label}
        <Icon
          size={14}
          aria-hidden="true"
          className={isActive ? "" : "opacity-40 transition-opacity group-hover:opacity-100"}
        />
      </button>
    </th>
  );
}
