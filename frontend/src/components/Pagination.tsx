"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { MenuItem, TextField } from "@mui/material";
import AppButton from "@/components/AppButton";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  itemsPerPageOptions?: number[];
  centeredLayout?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  total,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50],
  centeredLayout = false,
}: PaginationProps) {
  const getVisiblePages = (): number[] => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="flex items-center justify-between border-t border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))] px-4 py-3 sm:px-6">
      <div className="flex flex-1 items-center justify-between gap-2 sm:hidden">
        <AppButton
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          tone="outline"
          size="sm"
          startIcon={<ChevronLeft size={16} />}
          aria-label="Página anterior"
        >
          <span className="sr-only">Anterior</span>
        </AppButton>

        <div className="app-surface-muted px-3 py-1.5 text-xs font-medium text-[rgb(var(--app-text-secondary))]">
          Página {currentPage} de {Math.max(1, totalPages)}
        </div>

        <AppButton
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          tone="outline"
          size="sm"
          endIcon={<ChevronRight size={16} />}
          aria-label="Próxima página"
        >
          <span className="sr-only">Próximo</span>
        </AppButton>
      </div>

      <div
        className={`hidden flex-1 sm:flex ${
          centeredLayout ? "items-center" : "items-center justify-between"
        }`}
      >
        <div
          className={`flex items-center gap-2 ${
            centeredLayout ? "w-1/3 justify-start" : ""
          }`}
        >
          <p className="whitespace-nowrap text-sm text-gray-700">
            Registros: <span className="font-medium">{total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span>
            -<span className="font-medium">{Math.min(currentPage * itemsPerPage, total)}</span> de{" "}
            <span className="font-medium">{total}</span>
          </p>

          <TextField
            select
            label="Quantidade"
            variant="outlined"
            size="small"
            sx={{ minWidth: 110 }}
            value={itemsPerPage}
            onChange={(e) => {
              const nextItems = Number(e.target.value);
              onItemsPerPageChange(nextItems);
              if (currentPage !== 1) {
                onPageChange(1);
              }
            }}
            InputLabelProps={{ shrink: true }}
          >
            {itemsPerPageOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div className={centeredLayout ? "w-1/3 flex justify-center" : ""}>
          <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50"
              aria-label="Primeira página"
            >
              <ChevronsLeft size={18} />
            </button>

            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50"
              aria-label="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>

            {getVisiblePages().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center border px-4 py-2 text-sm font-semibold ${
                  page === currentPage
                    ? "z-10 border-blue-600 bg-blue-600 text-white focus-visible:ring-blue-400"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-cyan-400"
                } focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50"
              aria-label="Próxima página"
            >
              <ChevronRight size={18} />
            </button>

            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50"
              aria-label="Última página"
            >
              <ChevronsRight size={18} />
            </button>
          </nav>
        </div>

        {centeredLayout && <div className="w-1/3" />}
      </div>
    </div>
  );
}
