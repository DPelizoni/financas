"use client";

import { useEffect, useRef, useState } from "react";
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
import AppModal from "@/components/AppModal";
import { useFormDirty } from "@/forms/hooks/useFormDirty";

interface BankModalProps {
  isOpen: boolean;
  bank: Bank | null;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

const bankFields = ["nome", "codigo", "ativo"] as const;
type BankField = (typeof bankFields)[number];

const validateBankForm = (values: BankInput): FormFieldErrors<BankField> => {
  const errors: FormFieldErrors<BankField> = {};

  if (!values.nome || values.nome.trim().length < 2) {
    errors.nome = "Nome deve ter no mínimo 2 caracteres.";
  }


  return errors;
};

export default function BankModal({
  isOpen,
  bank,
  onClose,
  onSave,
}: BankModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<BankInput>({
    nome: "",
    codigo: "",
    ativo: true,
  });
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
    if (!isOpen) return;

    if (bank) {
      setFormData({
        nome: bank.nome,
        codigo: bank.codigo || "",
        ativo: bank.ativo,
      });
      setOriginalBank(bank);
    } else {
      setOriginalBank(null);
      setFormData({
        nome: "",
        codigo: "",
        ativo: true,
      });
    }

    clearAllErrors();
    resetTouched();
  }, [isOpen, bank, clearAllErrors, resetTouched]);

  const isDirty = useFormDirty(isOpen, formData);

  if (!isOpen) return null;

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

        if (trimmedNome !== originalBank.nome) {
          updates.nome = trimmedNome;
        }
        if (trimmedCodigo !== (originalBank.codigo || "")) {
          updates.codigo = trimmedCodigo || undefined;
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
    <AppModal
      isOpen={isOpen}
      title={bank ? "Editar Banco" : "Novo Banco"}
      onClose={onClose}
      size="sm"
      dirty={isDirty}
    >

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
          data-modal-close
          tone="outline"
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
    </AppModal>
  );
}
