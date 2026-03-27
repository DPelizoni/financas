"use client";

import { AlertTriangle, Trash2, XCircle } from "lucide-react";
import AppButton from "@/components/AppButton";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay">
      <div className="app-modal-content max-w-md">
        <div className="app-modal-header items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="app-badge-error rounded-full p-2">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[rgb(var(--app-text-primary))]">
                {title}
              </h3>
              <p className="mt-1 text-sm text-[rgb(var(--app-text-secondary))]">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="app-modal-body">
          <p className="text-sm text-[rgb(var(--app-text-secondary))]">
            Deseja continuar? Esta operacao nao pode ser desfeita.
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <AppButton
            onClick={onCancel}
            tone="outline-danger"
            startIcon={<XCircle size={16} />}
          >
            Cancelar
          </AppButton>
          <AppButton
            onClick={onConfirm}
            tone="danger"
            startIcon={<Trash2 size={16} />}
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
