"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { investimentoMovimentacaoService } from "@/services/investimentoService";
import {
  InvestimentoAtivo,
  InvestimentoMovimentacao,
  InvestimentoMovimentacaoInput,
  InvestimentoMovimentacaoTipo,
} from "@/types/investimento";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface InvestimentoMovimentacaoModalProps {
  isOpen: boolean;
  movimentacao: InvestimentoMovimentacao | null;
  ativos: InvestimentoAtivo[];
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

const movimentacaoFields = ["investimento_ativo_id", "tipo", "data", "valor"] as const;
type InvestimentoMovimentacaoField = (typeof movimentacaoFields)[number];

const tipoLabel: Record<InvestimentoMovimentacaoTipo, string> = {
  APORTE: "Aporte",
  RESGATE: "Resgate",
  RENDIMENTO: "Rendimentos",
};

const getCurrentLocalDate = (): string => {
  const now = new Date();
  const timezoneOffsetInMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
};

const validateMovimentacaoForm = (
  values: InvestimentoMovimentacaoInput,
): FormFieldErrors<InvestimentoMovimentacaoField> => {
  const errors: FormFieldErrors<InvestimentoMovimentacaoField> = {};

  if (!values.investimento_ativo_id || values.investimento_ativo_id <= 0) {
    errors.investimento_ativo_id = "Ativo é obrigatório.";
  }

  if (!values.tipo) {
    errors.tipo = "Tipo é obrigatório.";
  }

  if (!values.data) {
    errors.data = "Data é obrigatória.";
  }

  if (!Number.isFinite(values.valor) || values.valor <= 0) {
    errors.valor = "Valor deve ser maior que zero.";
  }

  return errors;
};

export default function InvestimentoMovimentacaoModal({
  isOpen,
  movimentacao,
  ativos,
  onClose,
  onSave,
}: InvestimentoMovimentacaoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [formData, setFormData] = useState<InvestimentoMovimentacaoInput>({
    investimento_ativo_id: 0,
    tipo: "APORTE",
    data: "",
    valor: 0,
  });
  const [originalMovimentacao, setOriginalMovimentacao] =
    useState<InvestimentoMovimentacao | null>(null);

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
  } = useFormFeedback<InvestimentoMovimentacaoField>(movimentacaoFields);

  const sortedAtivos = useMemo(
    () => [...ativos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [ativos],
  );

  const selectedAtivo = useMemo(
    () => ativos.find((item) => item.id === formData.investimento_ativo_id),
    [ativos, formData.investimento_ativo_id],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (movimentacao) {
      setFormData({
        investimento_ativo_id: movimentacao.investimento_ativo_id,
        tipo: movimentacao.tipo,
        data: movimentacao.data,
        valor: Number(movimentacao.valor),
      });
      setOriginalMovimentacao(movimentacao);
    } else {
      setOriginalMovimentacao(null);
      setFormData({
        investimento_ativo_id: sortedAtivos[0]?.id || 0,
        tipo: "APORTE",
        data: getCurrentLocalDate(),
        valor: 0,
      });
    }

    clearAllErrors();
    resetTouched();
  }, [isOpen, movimentacao, sortedAtivos, clearAllErrors, resetTouched]);

  useAccessibleModal({
    isOpen,
    modalRef,
    onClose,
  });

  if (!isOpen) return null;

  const updateField = <K extends keyof InvestimentoMovimentacaoInput>(
    field: K,
    value: InvestimentoMovimentacaoInput[K],
  ) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    } as InvestimentoMovimentacaoInput;

    setFormData(nextFormData);

    if (generalError) {
      clearGeneralError();
    }

    if (
      touched[field as InvestimentoMovimentacaoField] ||
      Object.values(touched).some(Boolean)
    ) {
      setFieldErrors(validateMovimentacaoForm(nextFormData));
    }
  };

  const handleFieldBlur = (field: InvestimentoMovimentacaoField) => {
    markFieldTouched(field);
    setFieldErrors(validateMovimentacaoForm(formData));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearGeneralError();

    const nextFieldErrors = validateMovimentacaoForm(formData);
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      focusFirstInvalidField(formRef, nextFieldErrors, movimentacaoFields);
      return;
    }

    try {
      setIsSubmitting(true);

      if (originalMovimentacao) {
        const updates: Partial<InvestimentoMovimentacaoInput> = {};

        if (
          formData.investimento_ativo_id !==
          originalMovimentacao.investimento_ativo_id
        ) {
          updates.investimento_ativo_id = formData.investimento_ativo_id;
        }
        if (formData.tipo !== originalMovimentacao.tipo) {
          updates.tipo = formData.tipo;
        }
        if (formData.data !== originalMovimentacao.data) {
          updates.data = formData.data;
        }
        if (Number(formData.valor) !== Number(originalMovimentacao.valor)) {
          updates.valor = Number(formData.valor);
        }

        if (Object.keys(updates).length === 0) {
          setGeneralError("Nenhuma alteração foi identificada para salvar.");
          return;
        }

        await investimentoMovimentacaoService.update(
          originalMovimentacao.id,
          updates,
        );
        await onSave("Movimentação atualizada com sucesso.");
      } else {
        const payload: InvestimentoMovimentacaoInput = {
          investimento_ativo_id: formData.investimento_ativo_id,
          tipo: formData.tipo,
          data: formData.data,
          valor: Number(formData.valor),
        };

        await investimentoMovimentacaoService.create(payload);
        await onSave("Movimentação criada com sucesso.");
      }
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<InvestimentoMovimentacaoField>(
        error,
        "Não foi possível concluir a operação.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(
          formRef,
          normalized.fieldErrors,
          movimentacaoFields,
        );
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
            {movimentacao ? "Editar Movimentação" : "Nova Movimentação"}
          </h2>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
          <div>
            <TextField
              id="investimento_ativo_id"
              name="investimento_ativo_id"
              select
              label="Ativo *"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.investimento_ativo_id}
              onChange={(e) =>
                updateField("investimento_ativo_id", Number(e.target.value))
              }
              onBlur={() => handleFieldBlur("investimento_ativo_id")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("investimento_ativo_id")}
              helperText={
                shouldShowError("investimento_ativo_id")
                  ? fieldErrors.investimento_ativo_id
                  : ""
              }
            >
              {sortedAtivos.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nome}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div>
            <TextField
              id="tipo"
              name="tipo"
              select
              label="Tipo *"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.tipo}
              onChange={(e) =>
                updateField("tipo", e.target.value as InvestimentoMovimentacaoTipo)
              }
              onBlur={() => handleFieldBlur("tipo")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("tipo")}
              helperText={shouldShowError("tipo") ? fieldErrors.tipo : ""}
            >
              <MenuItem value="APORTE">{tipoLabel.APORTE}</MenuItem>
              <MenuItem value="RESGATE">{tipoLabel.RESGATE}</MenuItem>
              <MenuItem value="RENDIMENTO">{tipoLabel.RENDIMENTO}</MenuItem>
            </TextField>
          </div>

          <div>
            <TextField
              id="data"
              name="data"
              type="date"
              label="Data *"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.data}
              onChange={(e) => updateField("data", e.target.value)}
              onBlur={() => handleFieldBlur("data")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("data")}
              helperText={shouldShowError("data") ? fieldErrors.data : ""}
            />
          </div>

          <div>
            <TextField
              id="valor"
              name="valor"
              type="number"
              label="Valor *"
              variant="outlined"
              size="small"
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
              value={formData.valor}
              onChange={(e) => updateField("valor", Number(e.target.value || 0))}
              onBlur={() => handleFieldBlur("valor")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("valor")}
              helperText={shouldShowError("valor") ? fieldErrors.valor : ""}
            />
          </div>

          <div className="rounded-md border border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-muted))] p-3 text-sm text-[rgb(var(--app-text-secondary))]">
            Banco: {selectedAtivo?.banco_nome || "-"}
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
              {isSubmitting
                ? "Salvando..."
                : movimentacao
                  ? "Atualizar"
                  : "Criar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
