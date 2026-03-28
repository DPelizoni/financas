"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ban, Save } from "lucide-react";
import { bankService } from "@/services/bankService";
import { Bank, BankInput } from "@/types/bank";
import AppButton from "@/components/AppButton";
import { TextField } from "@mui/material";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface BankModalProps {
  bank: Bank | null;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

export default function BankModal({ bank, onClose, onSave }: BankModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [formData, setFormData] = useState<BankInput>({
    nome: "",
    codigo: "",
    cor: "#3B82F6",
    icone: "",
    saldo_inicial: 0,
    ativo: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saldoDisplay, setSaldoDisplay] = useState("0,00");
  const [originalBank, setOriginalBank] = useState<Bank | null>(null);

  const formatBrlInput = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const parseBrlInput = (value: string): number => {
    if (!value || typeof value !== "string") return 0;
    const cleaned = value.trim().replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) && parsed >= 0
      ? Math.round(parsed * 100) / 100
      : 0;
  };

  const valueToNumber = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) && value >= 0
        ? Math.round(value * 100) / 100
        : 0;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return 0;

      // Detectar se é formato brasileiro (1.234,56) ou inglês (1234.56)
      // Se tem vírgula, é definitivamente brasileiro
      if (trimmed.includes(",")) {
        return parseBrlInput(trimmed);
      }

      // Se tem ponto e a última parte após o ponto tem 1-2 dígitos, é provavelmente decimal inglês
      if (trimmed.includes(".")) {
        const parts = trimmed.split(".");
        const afterDot = parts[parts.length - 1];
        // Se tem 1-2 dígitos após o último ponto, é decimal (inglês)
        if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
          const parsed = parseFloat(trimmed);
          return Number.isFinite(parsed) && parsed >= 0
            ? Math.round(parsed * 100) / 100
            : 0;
        }
      }

      // Sem ponto ou vírgula, é número inteiro ou número simples
      const parsed = parseFloat(trimmed);
      return Number.isFinite(parsed) && parsed >= 0
        ? Math.round(parsed * 100) / 100
        : 0;
    }
    return 0;
  };

  useEffect(() => {
    if (bank) {
      const currentSaldo = valueToNumber(bank.saldo_inicial);
      setFormData({
        nome: bank.nome,
        codigo: bank.codigo || "",
        cor: bank.cor,
        icone: bank.icone || "",
        saldo_inicial: currentSaldo,
        ativo: bank.ativo,
      });
      setOriginalBank(bank);

      const displayValue = formatBrlInput(currentSaldo);
      setSaldoDisplay(displayValue);
    } else {
      setOriginalBank(null);
      setSaldoDisplay(formatBrlInput(0));
    }
  }, [bank]);

  useAccessibleModal({
    isOpen: true,
    modalRef,
    onClose,
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter no mínimo 2 caracteres";
    }

    if (formData.cor && !/^#[0-9A-Fa-f]{6}$/.test(formData.cor)) {
      newErrors.cor = "Cor deve estar no formato hexadecimal (#RRGGBB)";
    }

    if (formData.saldo_inicial && formData.saldo_inicial < 0) {
      newErrors.saldo_inicial = "Saldo inicial não pode ser negativo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      if (originalBank) {
        const updates: Partial<BankInput> = {};
        const trimmedNome = formData.nome.trim();
        const trimmedCodigo = formData.codigo?.trim() || "";
        const trimmedIcone = formData.icone?.trim() || "";
        const currentSaldo = valueToNumber(formData.saldo_inicial);
        const originalSaldo = valueToNumber(originalBank.saldo_inicial);
        if (trimmedNome !== originalBank.nome) updates.nome = trimmedNome;
        if (trimmedCodigo !== (originalBank.codigo || "")) {
          updates.codigo = trimmedCodigo || undefined;
        }
        if (formData.cor !== originalBank.cor) updates.cor = formData.cor;
        if (trimmedIcone !== (originalBank.icone || "")) {
          updates.icone = trimmedIcone || undefined;
        }
        if (Math.abs(currentSaldo - originalSaldo) > 0.01) {
          updates.saldo_inicial = currentSaldo;
        }
        if (formData.ativo !== originalBank.ativo)
          updates.ativo = formData.ativo;
        if (Object.keys(updates).length === 0) {
          setErrors({
            geral: "Nenhuma alteração foi identificada para salvar.",
          });
          return;
        }

        await bankService.update(originalBank.id, updates);
        await onSave(`Banco "${trimmedNome}" atualizado com sucesso.`);
      } else {
        const payload: BankInput = {
          nome: formData.nome.trim(),
          codigo: formData.codigo?.trim() || undefined,
          cor: formData.cor,
          icone: formData.icone?.trim() || undefined,
          saldo_inicial: valueToNumber(formData.saldo_inicial),
          ativo: formData.ativo,
        };
        await bankService.create(payload);
        await onSave(`Banco "${payload.nome}" criado com sucesso.`);
      }
    } catch (error: any) {
      console.error("Erro ao salvar banco:", error);

      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      } else {
        setErrors({
          geral:
            error.response?.data?.message ||
            "Não foi possível concluir a operação.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BankInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="app-modal-overlay">
      <div
        ref={modalRef}
        className="app-modal-content max-h-[90vh] w-full max-w-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="app-modal-header p-6">
          <h2 id={titleId} className="text-xl font-bold text-gray-900">
            {bank ? "Editar Banco" : "Novo Banco"}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.geral && (
            <p className="app-inline-error">
              {errors.geral}
            </p>
          )}

          {/* Nome */}
          <div>
            <TextField
              type="text"
              label="Nome do Banco *"
              autoFocus
              variant="outlined"
              size="small"
              fullWidth
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Ex: Nubank, Itaú, Bradesco"
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.nome)}
              helperText={errors.nome}
            />
          </div>

          {/* Código */}
          <div>
            <TextField
              type="text"
              label="Código do Banco"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.codigo}
              onChange={(e) => handleChange("codigo", e.target.value)}
              placeholder="Ex: 260, 341"
              InputLabelProps={{ shrink: true }}
            />
          </div>

          {/* Cor */}
          <div>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => handleChange("cor", e.target.value)}
                className="h-11 w-20 cursor-pointer rounded border border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))]"
              />
              <TextField
                type="text"
                label="Cor"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.cor}
                onChange={(e) => handleChange("cor", e.target.value)}
                placeholder="#3B82F6"
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.cor)}
                helperText={errors.cor}
              />
            </div>
          </div>

          {/* Saldo Inicial */}
          <div>
            <TextField
              type="text"
              label="Saldo Inicial"
              inputMode="decimal"
              variant="outlined"
              size="small"
              fullWidth
              value={saldoDisplay}
              onChange={(e) => {
                const inputValue = e.target.value;
                const parsedValue = parseBrlInput(inputValue);
                setSaldoDisplay(inputValue);
                handleChange("saldo_inicial", parsedValue);
              }}
              onBlur={() => {
                const formatted = formatBrlInput(formData.saldo_inicial || 0);
                setSaldoDisplay(formatted);
              }}
              placeholder="0,00"
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.saldo_inicial)}
              helperText={errors.saldo_inicial}
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => handleChange("ativo", e.target.checked)}
              className="app-checkbox"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-[rgb(var(--app-text-secondary))]">
              Banco ativo
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <AppButton
              type="button"
              onClick={onClose}
              tone="outline-danger"
              fullWidth
              startIcon={<Ban size={16} />}
              disabled={loading}
            >
              Cancelar
            </AppButton>
            <AppButton
              type="submit"
              tone="primary"
              fullWidth
              startIcon={<Save size={16} />}
              disabled={loading}
            >
              {loading ? "Salvando..." : bank ? "Atualizar" : "Criar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}

