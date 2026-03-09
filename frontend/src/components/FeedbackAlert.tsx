"use client";

import { AlertCircle, CheckCircle, X } from "lucide-react";

interface FeedbackMessage {
  type: "success" | "error";
  message: string;
}

interface FeedbackAlertProps {
  feedback: FeedbackMessage | null;
  onClose: () => void;
  className?: string;
}

export default function FeedbackAlert({
  feedback,
  onClose,
  className = "mb-6",
}: FeedbackAlertProps) {
  if (!feedback) return null;

  return (
    <div
      className={`${className} flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
        feedback.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-start gap-2 text-sm font-medium">
        {feedback.type === "success" ? (
          <CheckCircle size={18} className="mt-0.5" />
        ) : (
          <AlertCircle size={18} className="mt-0.5" />
        )}
        <span>{feedback.message}</span>
      </div>
      <button
        onClick={onClose}
        className="rounded p-1 hover:bg-black/5"
        aria-label="Fechar notificação"
      >
        <X size={16} />
      </button>
    </div>
  );
}
