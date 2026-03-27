"use client";

import { XCircle } from "lucide-react";
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
  codigo: "Codigo",
  cor: "Cor",
  icone: "Icone",
  saldo_inicial: "Saldo inicial",
  ativo: "Status",
  tipo: "Tipo",
  categoria_id: "ID da categoria",
  categoria_nome: "Categoria",
  descricao_id: "ID da descricao",
  descricao_nome: "Descricao",
  banco_id: "ID do banco",
  banco_nome: "Banco",
  situacao: "Situacao",
  valor: "Valor",
  mes: "Mes",
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

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  if (/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(trimmedValue)) {
    return Number(trimmedValue.replace(/\./g, "").replace(",", "."));
  }

  if (/^-?\d+([.,]\d+)?$/.test(trimmedValue)) {
    return Number(trimmedValue.replace(",", "."));
  }

  return null;
};

const getCurrencyValue = (key: string, value: unknown): number | null => {
  if (!/(valor|saldo|preco|preco|total)/i.test(key)) {
    return null;
  }

  return parseNumericValue(value);
};

const formatCurrencyBR = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatStatusValue = (value: unknown): string | null => {
  if (typeof value === "boolean") {
    return value ? "Ativo" : "Inativo";
  }

  if (typeof value === "number") {
    if (value === 1) return "Ativo";
    if (value === 0) return "Inativo";
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["1", "true", "ativo", "ativa", "active"].includes(normalizedValue)) {
    return "Ativo";
  }

  if (["0", "false", "inativo", "inativa", "inactive"].includes(normalizedValue)) {
    return "Inativo";
  }

  return null;
};

const formatValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (key === "created_at" || key === "updated_at") {
    return formatDateTimeBR(value);
  }

  if (key === "ativo" || key === "status") {
    const formattedStatus = formatStatusValue(value);
    if (formattedStatus) {
      return formattedStatus;
    }
  }

  const currencyValue = getCurrencyValue(key, value);
  if (currencyValue !== null) {
    return formatCurrencyBR(currencyValue);
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Nao";
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

  const dataRecord = data as Record<string, unknown>;
  const filteredEntries = Object.entries(dataRecord).filter(([key, value]) => {
    if (typeof value === "function") {
      return false;
    }

    if (key.endsWith("_id")) {
      const baseKey = key.slice(0, -3);
      const relatedNameKeys = [`${baseKey}_nome`, `${baseKey}_name`];
      if (relatedNameKeys.some((relatedKey) => relatedKey in dataRecord)) {
        return false;
      }
    }

    return true;
  });

  const timestampOrder: Record<"created_at" | "updated_at", number> = {
    created_at: 0,
    updated_at: 1,
  };

  const entries = [
    ...filteredEntries.filter(
      ([key]) => key !== "created_at" && key !== "updated_at",
    ),
    ...filteredEntries
      .filter(([key]) => key === "created_at" || key === "updated_at")
      .sort(
        ([leftKey], [rightKey]) =>
          timestampOrder[leftKey as "created_at" | "updated_at"] -
          timestampOrder[rightKey as "created_at" | "updated_at"],
      ),
  ];

  return (
    <div className="app-modal-overlay">
      <div className="app-modal-content max-h-[90vh] max-w-3xl overflow-hidden">
        <div className="app-modal-header">
          <h2 className="text-lg font-semibold text-[rgb(var(--app-text-primary))]">{title}</h2>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {entries.length === 0 ? (
            <p className="text-sm text-[rgb(var(--app-text-secondary))]">
              Nenhum dado disponivel para exibicao.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {entries.map(([key, value]) => (
                <div
                  key={key}
                  className="app-surface-muted rounded-lg border p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-text-muted))]">
                    {fieldLabels[key] || formatLabel(key)}
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-[rgb(var(--app-text-primary))]">
                    {formatValue(key, value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="app-modal-footer">
          <AppButton
            onClick={onClose}
            tone="outline-danger"
            startIcon={<XCircle size={16} />}
          >
            Fechar
          </AppButton>
        </div>
      </div>
    </div>
  );
}
