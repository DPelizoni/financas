"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ban, Save } from "lucide-react";
import { MenuItem, TextField } from "@mui/material";
import AppButton from "@/components/AppButton";
import FormErrorSummary from "@/forms/components/FormErrorSummary";
import {
  focusFirstInvalidField,
  FormFieldErrors,
  hasFormFieldErrors,
  normalizeApiFormError,
} from "@/forms/core/form-error";
import { useFormFeedback } from "@/forms/hooks/useFormFeedback";
import { investimentoAtivoService } from "@/services/investimentoService";
import { Bank } from "@/types/bank";
import { InvestimentoAtivo, InvestimentoAtivoInput } from "@/types/investimento";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface InvestimentoAtivoModalProps {
  ativo: InvestimentoAtivo | null;
  banks: Bank[];
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

const ativoFields = [
  "nome",
  "banco_id",
  "saldo_inicial",
  "data_saldo_inicial",
  "ativo",
] as const;
type InvestimentoAtivoField = (typeof ativoFields)[number];

const getCurrentLocalDate = (): string => {
  const now = new Date();
  const timezoneOffsetInMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
};

const validateAtivoForm = (
  values: InvestimentoAtivoInput,
): FormFieldErrors<InvestimentoAtivoField> => {
  const errors: FormFieldErrors<InvestimentoAtivoField> = {};

  if (!values.nome || values.nome.trim().length < 2) {
    errors.nome = "Nome deve ter no mínimo 2 caracteres.";
  }

  if (!values.banco_id || values.banco_id <= 0) {
    errors.banco_id = "Banco é obrigatório.";
  }

  if (!Number.isFinite(values.saldo_inicial) || values.saldo_inicial < 0) {
    errors.saldo_inicial = "Saldo inicial deve ser um valor válido.";
  }

  if (!values.data_saldo_inicial) {
    errors.data_saldo_inicial = "Data do saldo inicial é obrigatória.";
  }

  return errors;
};

export default function InvestimentoAtivoModal({
  ativo,
  banks,
  onClose,
  onSave,
}: InvestimentoAtivoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [formData, setFormData] = useState<InvestimentoAtivoInput>({
    nome: "",
    banco_id: 0,
    saldo_inicial: 0,
    data_saldo_inicial: "",
    ativo: true,
  });
  const [originalAtivo, setOriginalAtivo] = useState<InvestimentoAtivo | null>(
    null,
  );

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
  } = useFormFeedback<InvestimentoAtivoField>(ativoFields);

  useEffect(() => {
    if (ativo) {
      setFormData({
        nome: ativo.nome,
        banco_id: ativo.banco_id,
        saldo_inicial: Number(ativo.saldo_inicial),
        data_saldo_inicial: ativo.data_saldo_inicial,
        ativo: ativo.ativo,
      });
      setOriginalAtivo(ativo);
    } else {
      setOriginalAtivo(null);
      setFormData({
        nome: "",
        banco_id: banks[0]?.id || 0,
        saldo_inicial: 0,
        data_saldo_inicial: getCurrentLocalDate(),
        ativo: true,
      });
    }

    clearAllErrors();
    resetTouched();
  }, [ativo, banks, clearAllErrors, resetTouched]);

  useAccessibleModal({
    isOpen: true,
    modalRef,
    onClose,
  });

  const updateField = <K extends keyof InvestimentoAtivoInput>(
    field: K,
    value: InvestimentoAtivoInput[K],
  ) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    } as InvestimentoAtivoInput;

    setFormData(nextFormData);

    if (generalError) {
      clearGeneralError();
    }

    if (
      touched[field as InvestimentoAtivoField] ||
      Object.values(touched).some(Boolean)
    ) {
      setFieldErrors(validateAtivoForm(nextFormData));
    }
  };

  const handleFieldBlur = (field: InvestimentoAtivoField) => {
    markFieldTouched(field);
    setFieldErrors(validateAtivoForm(formData));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearGeneralError();

    const nextFieldErrors = validateAtivoForm(formData);
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      focusFirstInvalidField(formRef, nextFieldErrors, ativoFields);
      return;
    }

    try {
      setIsSubmitting(true);

      if (originalAtivo) {
        const updates: Partial<InvestimentoAtivoInput> = {};

        if (formData.nome.trim() !== originalAtivo.nome) {
          updates.nome = formData.nome.trim();
        }
        if (formData.banco_id !== originalAtivo.banco_id) {
          updates.banco_id = formData.banco_id;
        }
        if (Number(formData.saldo_inicial) !== Number(originalAtivo.saldo_inicial)) {
          updates.saldo_inicial = Number(formData.saldo_inicial);
        }
        if (formData.data_saldo_inicial !== originalAtivo.data_saldo_inicial) {
          updates.data_saldo_inicial = formData.data_saldo_inicial;
        }
        if (formData.ativo !== originalAtivo.ativo) {
          updates.ativo = formData.ativo;
        }

        if (Object.keys(updates).length === 0) {
          setGeneralError("Nenhuma alteração foi identificada para salvar.");
          return;
        }

        await investimentoAtivoService.update(originalAtivo.id, updates);
        await onSave(`Ativo "${formData.nome}" atualizado com sucesso.`);
      } else {
        const payload: InvestimentoAtivoInput = {
          nome: formData.nome.trim(),
          banco_id: formData.banco_id,
          saldo_inicial: Number(formData.saldo_inicial),
          data_saldo_inicial: formData.data_saldo_inicial,
          ativo: formData.ativo,
        };

        await investimentoAtivoService.create(payload);
        await onSave(`Ativo "${payload.nome}" criado com sucesso.`);
      }
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<InvestimentoAtivoField>(
        error,
        "Não foi possível concluir a operação.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(formRef, normalized.fieldErrors, ativoFields);
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
            {ativo ? "Editar Ativo" : "Novo Ativo"}
          </h2>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
          <div>
            <TextField
              id="nome"
              name="nome"
              type="text"
              label="Nome do Ativo *"
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
              id="banco_id"
              name="banco_id"
              select
              label="Banco *"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.banco_id}
              onChange={(e) => updateField("banco_id", Number(e.target.value))}
              onBlur={() => handleFieldBlur("banco_id")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("banco_id")}
              helperText={shouldShowError("banco_id") ? fieldErrors.banco_id : ""}
            >
              {banks.map((bank) => (
                <MenuItem key={bank.id} value={bank.id}>
                  {bank.nome}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div>
            <TextField
              id="saldo_inicial"
              name="saldo_inicial"
              type="number"
              label="Saldo Inicial *"
              variant="outlined"
              size="small"
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
              value={formData.saldo_inicial}
              onChange={(e) =>
                updateField("saldo_inicial", Number(e.target.value || 0))
              }
              onBlur={() => handleFieldBlur("saldo_inicial")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("saldo_inicial")}
              helperText={
                shouldShowError("saldo_inicial") ? fieldErrors.saldo_inicial : ""
              }
            />
          </div>

          <div>
            <TextField
              id="data_saldo_inicial"
              name="data_saldo_inicial"
              type="date"
              label="Data do Saldo Inicial *"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.data_saldo_inicial}
              onChange={(e) =>
                updateField("data_saldo_inicial", e.target.value)
              }
              onBlur={() => handleFieldBlur("data_saldo_inicial")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("data_saldo_inicial")}
              helperText={
                shouldShowError("data_saldo_inicial")
                  ? fieldErrors.data_saldo_inicial
                  : ""
              }
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              name="ativo"
              checked={Boolean(formData.ativo)}
              onChange={(e) => updateField("ativo", e.target.checked)}
              onBlur={() => handleFieldBlur("ativo")}
              className="app-checkbox"
            />
            <label
              htmlFor="ativo"
              className="ml-2 block text-sm text-[rgb(var(--app-text-secondary))]"
            >
              Ativo habilitado
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
              {isSubmitting ? "Salvando..." : ativo ? "Atualizar" : "Criar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
