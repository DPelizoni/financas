"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import AppButton from "@/components/AppButton";
import AppModal from "@/components/AppModal";

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
  return (
    <AppModal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onCancel}
      size="sm"
      headerIcon={
        <div className="app-badge-error shrink-0 rounded-full p-2">
          <AlertTriangle size={18} />
        </div>
      }
    >
      <div className="app-modal-body">
        <p className="text-sm text-[rgb(var(--app-text-secondary))]">
          Deseja continuar? Esta operação não pode ser desfeita.
        </p>
      </div>

      <div className="app-modal-actions">
        <AppButton
          data-modal-close
          tone="outline"
          className="w-full sm:w-auto"
          data-modal-initial-focus
        >
          Cancelar
        </AppButton>
        <AppButton
          onClick={onConfirm}
          tone="danger"
          className="w-full sm:w-auto"
          startIcon={<Trash2 size={16} />}
        >
          {confirmLabel}
        </AppButton>
      </div>
    </AppModal>
  );
}
