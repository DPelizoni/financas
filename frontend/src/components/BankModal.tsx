"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ban, Save } from "lucide-react";
import { TextField } from "@mui/material";
import AppButton from "@/components/AppButton";
import FormErrorSummary from "@/forms/components/FormErrorSummary";
import {
  focusFirstInvalidField,
  FormFieldErrors,
  hasFormFieldErrors,
  normalizeApiFormError,
} from "@/forms/core/form-error";
import { useFormFeedback } from "@/forms/hooks/useFormFeedback";
import { bankService } from "@/services/bankService";
import { Bank, BankInput } from "@/types/bank";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface BankModalProps {
  bank: Bank | null;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

const bankFields = ["nome", "codigo", "cor", "saldo_inicial", "ativo"] as const;
type BankField = (typeof bankFields)[number];

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

    if (trimmed.includes(",")) {
      return parseBrlInput(trimmed);
    }

    if (trimmed.includes(".")) {
      const parts = trimmed.split(".");
      const afterDot = parts[parts.length - 1];
      if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
        const parsed = parseFloat(trimmed);
        return Number.isFinite(parsed) && parsed >= 0
          ? Math.round(parsed * 100) / 100
          : 0;
      }
    }

    const parsed = parseFloat(trimmed);
    return Number.isFinite(parsed) && parsed >= 0
      ? Math.round(parsed * 100) / 100
      : 0;
  }

  return 0;
};

const validateBankForm = (values: BankInput): FormFieldErrors<BankField> => {
  const errors: FormFieldErrors<BankField> = {};

  if (!values.nome || values.nome.trim().length < 2) {
    errors.nome = "Nome deve ter no mínimo 2 caracteres.";
  }

  if (values.cor && !/^#[0-9A-Fa-f]{6}$/.test(values.cor)) {
    errors.cor = "Cor deve estar no formato hexadecimal (#RRGGBB).";
  }

  if (valueToNumber(values.saldo_inicial) < 0) {
    errors.saldo_inicial = "Saldo inicial não pode ser negativo.";
  }

  return errors;
};

export default function BankModal({ bank, onClose, onSave }: BankModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [formData, setFormData] = useState<BankInput>({
    nome: "",
    codigo: "",
    cor: "#3B82F6",
    saldo_inicial: 0,
    ativo: true,
  });
  const [saldoDisplay, setSaldoDisplay] = useState("0,00");
  const [originalBank, setOriginalBank] = useState<Bank | null>(null);

  const {
    touched,
    fieldErrors,
    generalError,
    isSubmitting,
    setGeneralError,
    clearGeneralError,
    setIsSubmitting,
    setFieldErrors,
    markFieldTouched,
    markAllTouched,
    clearAllErrors,
    resetTouched,
    shouldShowError,
  } = useFormFeedback<BankField>(bankFields);

  useEffect(() => {
    if (bank) {
      const currentSaldo = valueToNumber(bank.saldo_inicial);
      setFormData({
        nome: bank.nome,
        codigo: bank.codigo || "",
        cor: bank.cor,
        saldo_inicial: currentSaldo,
        ativo: bank.ativo,
      });
      setOriginalBank(bank);
      setSaldoDisplay(formatBrlInput(currentSaldo));
    } else {
      setOriginalBank(null);
      setFormData({
        nome: "",
        codigo: "",
        cor: "#3B82F6",
        saldo_inicial: 0,
        ativo: true,
      });
      setSaldoDisplay(formatBrlInput(0));
    }

    clearAllErrors();
    resetTouched();
  }, [bank, clearAllErrors, resetTouched]);

  useAccessibleModal({
    isOpen: true,
    modalRef,
    onClose,
  });

  const updateField = <K extends keyof BankInput>(
    field: K,
    value: BankInput[K],
  ) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    } as BankInput;

    setFormData(nextFormData);

    if (generalError) {
      clearGeneralError();
    }

    if (touched[field as BankField] || Object.values(touched).some(Boolean)) {
      setFieldErrors(validateBankForm(nextFormData));
    }
  };

  const handleFieldBlur = (field: BankField) => {
    markFieldTouched(field);
    setFieldErrors(validateBankForm(formData));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearGeneralError();

    const nextFieldErrors = validateBankForm(formData);
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      focusFirstInvalidField(formRef, nextFieldErrors, bankFields);
      return;
    }

    try {
      setIsSubmitting(true);

      if (originalBank) {
        const updates: Partial<BankInput> = {};
        const trimmedNome = formData.nome.trim();
        const trimmedCodigo = formData.codigo?.trim() || "";
        const currentSaldo = valueToNumber(formData.saldo_inicial);
        const originalSaldo = valueToNumber(originalBank.saldo_inicial);

        if (trimmedNome !== originalBank.nome) {
          updates.nome = trimmedNome;
        }
        if (trimmedCodigo !== (originalBank.codigo || "")) {
          updates.codigo = trimmedCodigo || undefined;
        }
        if (formData.cor !== originalBank.cor) {
          updates.cor = formData.cor;
        }
        if (Math.abs(currentSaldo - originalSaldo) > 0.01) {
          updates.saldo_inicial = currentSaldo;
        }
        if (formData.ativo !== originalBank.ativo) {
          updates.ativo = formData.ativo;
        }

        if (Object.keys(updates).length === 0) {
          setGeneralError("Nenhuma alteração foi identificada para salvar.");
          return;
        }

        await bankService.update(originalBank.id, updates);
        await onSave(`Banco \"${trimmedNome}\" atualizado com sucesso.`);
      } else {
        const payload: BankInput = {
          nome: formData.nome.trim(),
          codigo: formData.codigo?.trim() || undefined,
          cor: formData.cor,
          saldo_inicial: valueToNumber(formData.saldo_inicial),
          ativo: formData.ativo,
        };

        await bankService.create(payload);
        await onSave(`Banco \"${payload.nome}\" criado com sucesso.`);
      }
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<BankField>(
        error,
        "Não foi possível concluir a operação.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(formRef, normalized.fieldErrors, bankFields);
      } else {
        setGeneralError(normalized.generalMessage);
      }
    } finally {
      setIsSubmitting(false);
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
        <div className="app-modal-header p-6">
          <h2 id={titleId} className="text-xl font-bold text-gray-900">
            {bank ? "Editar Banco" : "Novo Banco"}
          </h2>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <TextField
              id="nome"
              name="nome"
              type="text"
              label="Nome do Banco *"
              autoFocus
              variant="outlined"
              size="small"
              fullWidth
              value={formData.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              onBlur={() => handleFieldBlur("nome")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("nome")}
              helperText={shouldShowError("nome") ? fieldErrors.nome : ""}
            />
          </div>

          <div>
            <TextField
              id="codigo"
              name="codigo"
              type="text"
              label="Código do Banco"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.codigo}
              onChange={(e) => updateField("codigo", e.target.value)}
              onBlur={() => handleFieldBlur("codigo")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("codigo")}
              helperText={shouldShowError("codigo") ? fieldErrors.codigo : ""}
            />
          </div>

          <div>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => updateField("cor", e.target.value)}
                className="h-11 w-20 cursor-pointer rounded border border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))]"
              />
              <TextField
                id="cor"
                name="cor"
                type="text"
                label="Cor"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.cor}
                onChange={(e) => updateField("cor", e.target.value)}
                onBlur={() => handleFieldBlur("cor")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("cor")}
                helperText={shouldShowError("cor") ? fieldErrors.cor : ""}
              />
            </div>
          </div>

          <div>
            <TextField
              id="saldo_inicial"
              name="saldo_inicial"
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
                updateField("saldo_inicial", parsedValue);
              }}
              onBlur={() => {
                handleFieldBlur("saldo_inicial");
                const formatted = formatBrlInput(valueToNumber(formData.saldo_inicial));
                setSaldoDisplay(formatted);
              }}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("saldo_inicial")}
              helperText={
                shouldShowError("saldo_inicial") ? fieldErrors.saldo_inicial : ""
              }
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              name="ativo"
              checked={formData.ativo}
              onChange={(e) => updateField("ativo", e.target.checked)}
              onBlur={() => handleFieldBlur("ativo")}
              className="app-checkbox"
            />
            <label
              htmlFor="ativo"
              className="ml-2 block text-sm text-[rgb(var(--app-text-secondary))]"
            >
              Banco ativo
            </label>
          </div>

          <FormErrorSummary generalMessage={generalError} />

          <div className="app-modal-actions pt-4">
            <AppButton
              type="button"
              onClick={onClose}
              tone="outline-danger"
              className="w-full sm:w-auto"
              startIcon={<Ban size={16} />}
              disabled={isSubmitting}
            >
              Cancelar
            </AppButton>
            <AppButton
              type="submit"
              tone="primary"
              className="w-full sm:w-auto"
              startIcon={<Save size={16} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : bank ? "Atualizar" : "Criar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
