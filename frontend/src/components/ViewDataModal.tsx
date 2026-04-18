"use client";

import { useId, useRef, useState } from "react";
import { 
  XCircle, 
  Copy, 
  Check, 
  Clock, 
  Calendar, 
  Fingerprint, 
  Activity, 
  Palette, 
  Hash, 
  Coins, 
  FileText, 
  Building2, 
  Tag,
  Info
} from "lucide-react";
import AppButton from "@/components/AppButton";
import { formatDateTimeBR } from "@/utils/formatDateTimeBR";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface ViewDataModalProps {
  isOpen: boolean;
  title: string;
  data: object | null;
  onClose: () => void;
  fieldLabels?: Record<string, string>;
}

const defaultFieldLabels: Record<string, string> = {
  id: "Identificador",
  nome: "Nome",
  codigo: "Código",
  cor: "Cor de Identificação",
  icone: "Ícone Representativo",
  saldo_inicial: "Saldo Inicial",
  ativo: "Status do Registro",
  tipo: "Tipo",
  categoria_id: "ID da Categoria",
  categoria_nome: "Categoria",
  descricao_id: "ID da Descrição",
  descricao_nome: "Descrição",
  banco_id: "ID do Banco",
  banco_nome: "Banco",
  situacao: "Situação",
  valor: "Valor Monetário",
  mes: "Mês de Referência",
  vencimento: "Data de Vencimento",
  created_at: "Data de Criação",
  updated_at: "Última Atualização",
};

const getFieldIcon = (key: string) => {
  const k = key.toLowerCase();
  if (k === "id") return <Fingerprint size={14} className="text-blue-500" />;
  if (k.includes("nome")) return <Info size={14} className="text-slate-500" />;
  if (k === "codigo" || k === "code") return <Hash size={14} className="text-amber-500" />;
  if (k === "cor" || k === "color") return <Palette size={14} className="text-pink-500" />;
  if (k === "icone" || k === "icon") return <FileText size={14} className="text-indigo-500" />;
  if (k.includes("saldo") || k.includes("valor") || k.includes("preco") || k.includes("total")) return <Coins size={14} className="text-emerald-500" />;
  if (k === "ativo" || k === "status" || k.endsWith("_status") || k === "situacao") return <Activity size={14} className="text-cyan-500" />;
  if (k === "vencimento" || k === "data" || k.includes("date")) return <Calendar size={14} className="text-rose-500" />;
  if (k.includes("banco")) return <Building2 size={14} className="text-blue-600" />;
  if (k.includes("categoria")) return <Tag size={14} className="text-purple-500" />;
  if (k === "created_at" || k === "updated_at") return <Clock size={14} className="text-slate-400" />;
  return <FileText size={14} className="text-slate-400" />;
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

const formatStatusValue = (value: unknown): { label: string; active: boolean } | null => {
  if (typeof value === "boolean") {
    return { label: value ? "Ativo" : "Inativo", active: value };
  }

  if (typeof value === "number") {
    if (value === 1) return { label: "Ativo", active: true };
    if (value === 0) return { label: "Inativo", active: false };
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["1", "true", "ativo", "ativa", "active"].includes(normalizedValue)) {
    return { label: "Ativo", active: true };
  }

  if (["0", "false", "inativo", "inativa", "inactive"].includes(normalizedValue)) {
    return { label: "Inativo", active: false };
  }

  return null;
};

const isDateField = (key: string): boolean => {
  const normalizedKey = key.toLowerCase();

  if (normalizedKey === "created_at" || normalizedKey === "updated_at") {
    return false;
  }

  return (
    normalizedKey === "data" ||
    normalizedKey === "date" ||
    normalizedKey === "vencimento" ||
    normalizedKey.startsWith("data_") ||
    normalizedKey.endsWith("_data") ||
    normalizedKey.endsWith("_date")
  );
};

const formatDateOnlyBR = (value: unknown): string | null => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const rawValue = value.trim();
  if (!rawValue) {
    return null;
  }

  const isoDateMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  const brDateMatch = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brDateMatch) {
    const [, day, month, year] = brDateMatch;
    return `${day}/${month}/${year}`;
  }

  const normalizedValue =
    rawValue.includes(" ") && !rawValue.includes("T")
      ? rawValue.replace(" ", "T")
      : rawValue;

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
};

export default function ViewDataModal({
  isOpen,
  title,
  data,
  onClose,
  fieldLabels = {},
}: ViewDataModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useAccessibleModal({
    isOpen: isOpen && Boolean(data),
    modalRef,
    onClose,
  });

  if (!isOpen || !data) {
    return null;
  }

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dataRecord = data as Record<string, unknown>;
  
  const entries = Object.entries(dataRecord).filter(([key, value]) => {
    if (typeof value === "function") return false;
    
    // Hide ID fields if the named version exists
    if (key.endsWith("_id")) {
      const baseKey = key.slice(0, -3);
      const relatedNameKeys = [`${baseKey}_nome`, `${baseKey}_name`];
      if (relatedNameKeys.some((relatedKey) => relatedKey in dataRecord)) {
        return false;
      }
    }
    return true;
  });

  const metadataFields = ["created_at", "updated_at"];
  const regularEntries = entries.filter(([key]) => !metadataFields.includes(key));
  const timestampEntries = entries
    .filter(([key]) => metadataFields.includes(key))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const renderValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-slate-400 italic">Nulo</span>;
    }

    // Color field
    if (key === "cor" || key === "color") {
      const colorValue = String(value);
      return (
        <div className="flex items-center gap-2">
          <div 
            className="h-4 w-4 rounded-full border border-slate-200 shadow-sm" 
            style={{ backgroundColor: colorValue }}
          />
          <code className="text-xs font-mono">{colorValue}</code>
        </div>
      );
    }

    // Status field
    if (key === "ativo" || key === "status" || key.endsWith("_status")) {
      const status = formatStatusValue(value);
      if (status) {
        return (
          <span className={`app-badge-${status.active ? 'success' : 'error'}`}>
            {status.label}
          </span>
        );
      }
    }

    // Currency
    const currencyValue = getCurrencyValue(key, value);
    if (currencyValue !== null) {
      let colorClass = "text-emerald-600 dark:text-emerald-400";
      
      const k = key.toLowerCase();
      if (k.includes("aporte")) {
        colorClass = "text-amber-600 dark:text-amber-400";
      } else if (k.includes("resgate")) {
        colorClass = "text-red-600 dark:text-red-400";
      } else if (k.includes("saldo")) {
        colorClass = "text-blue-600 dark:text-blue-400";
      } else if (k.includes("rendimento")) {
        colorClass = "text-emerald-600 dark:text-emerald-400";
      }

      return (
        <span className={`font-semibold ${colorClass}`}>
          {formatCurrencyBR(currencyValue)}
        </span>
      );
    }

    // Dates
    if (isDateField(key)) {
      const formattedDate = formatDateOnlyBR(value);
      if (formattedDate) return formattedDate;
    }

    // Timestamps
    if (key === "created_at" || key === "updated_at") {
      return formatDateTimeBR(value);
    }

    if (typeof value === "boolean") {
      return value ? "Sim" : "Não";
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "-";
    }

    return String(value);
  };

  const isCopyable = (key: string) => ["id", "codigo", "code"].includes(key.toLowerCase());

  return (
    <div className="app-modal-overlay backdrop-blur-sm transition-all duration-300">
      <div
        ref={modalRef}
        className="app-modal-content max-h-[90vh] max-w-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="app-modal-header !bg-slate-50 dark:!bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
              {title.toLowerCase().includes("banco") ? <Building2 size={20} /> : <FileText size={20} />}
            </div>
            <h2 id={titleId} className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <XCircle size={22} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="p-6">
            {regularEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Info size={48} strokeWidth={1} className="mb-2 opacity-20" />
                <p>Nenhum dado disponível.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                {regularEntries.map(([key, value]) => (
                  <div key={key} className="group flex flex-col space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {getFieldIcon(key)}
                      {fieldLabels[key] || formatLabel(key)}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words flex-1">
                        {renderValue(key, value)}
                      </div>
                      
                      {isCopyable(key) && (
                        <button
                          onClick={() => handleCopy(key, String(value))}
                          className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                          title="Copiar valor"
                        >
                          {copiedKey === key ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {timestampEntries.length > 0 && (
            <div className="bg-slate-50/80 dark:bg-slate-900/40 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {timestampEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-slate-400">
                      {getFieldIcon(key)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 leading-none mb-1">
                        {fieldLabels[key] || formatLabel(key)}
                      </p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {renderValue(key, value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="app-modal-footer !bg-white dark:!bg-slate-900 !border-t-slate-100 dark:!border-t-slate-800">
          <AppButton
            onClick={onClose}
            tone="outline"
            className="min-w-[120px] shadow-sm"
            data-modal-initial-focus
          >
            Fechar
          </AppButton>
        </div>
      </div>
    </div>
  );
}
