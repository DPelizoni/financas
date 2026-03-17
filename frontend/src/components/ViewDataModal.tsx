"use client";

import { X, XCircle } from "lucide-react";
import AppButton from "@/components/AppButton";
import { formatDateTimeBR } from "@/utils/formatDateTimeBR";

interface ViewDataModalProps {
  isOpen: boolean;
  title: string;
  data: object | null;
  onClose: () => void;
  fieldLabels?: Record<string, string>;
}

const defaultFieldLabels: Record<string, string> = {
  id: "ID",
  nome: "Nome",
  codigo: "Código",
  cor: "Cor",
  icone: "Ícone",
  saldo_inicial: "Saldo inicial",
  ativo: "Ativo",
  tipo: "Tipo",
  categoria_id: "ID da categoria",
  categoria_nome: "Categoria",
  descricao_id: "ID da descrição",
  descricao_nome: "Descrição",
  banco_id: "ID do banco",
  banco_nome: "Banco",
  situacao: "Situação",
  valor: "Valor",
  mes: "Mês",
  vencimento: "Vencimento",
  created_at: "Criado em",
  updated_at: "Atualizado em",
};

const formatLabel = (key: string): string => {
  if (defaultFieldLabels[key]) {
    return defaultFieldLabels[key];
  }

  return key
    .replace(/_/g, " ")
    .replace(/\bid\b/g, "ID")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (key === "created_at" || key === "updated_at") {
    return formatDateTimeBR(value);
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export default function ViewDataModal({
  isOpen,
  title,
  data,
  onClose,
  fieldLabels = {},
}: ViewDataModalProps) {
  if (!isOpen || !data) {
    return null;
  }

  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([, value]) => typeof value !== "function",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar modal de visualização"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhum dado disponível para exibição.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {entries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {fieldLabels[key] || formatLabel(key)}
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-gray-900">
                    {formatValue(key, value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <AppButton onClick={onClose} tone="outline" startIcon={<XCircle size={16} />}>
            Fechar
          </AppButton>
        </div>
      </div>
    </div>
  );
}
