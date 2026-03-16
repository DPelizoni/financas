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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-start gap-3 border-b border-gray-200 px-6 py-4">
          <div className="rounded-full bg-red-100 p-2 text-red-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">
            Deseja continuar? Esta operação não pode ser desfeita.
          </p>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <AppButton
            onClick={onCancel}
            tone="outline"
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
