"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { bankService } from "@/services/bankService";
import { categoryService } from "@/services/categoryService";
import { descricaoService } from "@/services/descricaoService";
import { transacaoService } from "@/services/transacaoService";
import { Bank } from "@/types/bank";
import { Category } from "@/types/category";
import { Descricao } from "@/types/descricao";
import { Transacao, TransacaoInput } from "@/types/transacao";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface TransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  transacao?: Transacao;
  isEditing?: boolean;
}

const transacaoFields = [
  "mes",
  "vencimento",
  "tipo",
  "categoria_id",
  "descricao_id",
  "banco_id",
  "situacao",
  "valor",
] as const;
type TransacaoField = (typeof transacaoFields)[number];

const validateTransacaoForm = (
  values: TransacaoInput,
): FormFieldErrors<TransacaoField> => {
  const errors: FormFieldErrors<TransacaoField> = {};

  if (!values.mes || !/^\d{2}\/\d{4}$/.test(values.mes)) {
    errors.mes = "Mês deve estar no formato MM/AAAA.";
  }

  if (!values.vencimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(values.vencimento)) {
    errors.vencimento = "Vencimento deve estar no formato DD/MM/AAAA.";
  }

  if (!values.tipo) {
    errors.tipo = "Tipo é obrigatório.";
  }

  if (values.categoria_id <= 0) {
    errors.categoria_id = "Categoria é obrigatória.";
  }

  if (values.descricao_id <= 0) {
    errors.descricao_id = "Descrição é obrigatória.";
  }

  if (values.banco_id <= 0) {
    errors.banco_id = "Banco é obrigatório.";
  }

  if (values.valor <= 0) {
    errors.valor = "Valor deve ser maior que zero.";
  }

  return errors;
};

const parseMes = (mes: string): { month: number; year: number } => {
  if (!/^\d{2}\/\d{4}$/.test(mes)) {
    throw new Error("Mês deve estar no formato MM/AAAA.");
  }

  const [monthStr, yearStr] = mes.split("/");
  const month = Number(monthStr);
  const year = Number(yearStr);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Mês inválido.");
  }

  return { month, year };
};

const parseVencimento = (
  vencimento: string,
): { day: number; month: number; year: number } => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(vencimento)) {
    throw new Error("Vencimento deve estar no formato DD/MM/AAAA.");
  }

  const [dayStr, monthStr, yearStr] = vencimento.split("/");
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  const parsed = new Date(year, month - 1, day);
  const isValidDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  if (!isValidDate) {
    throw new Error("Vencimento inválido.");
  }

  return { day, month, year };
};

const addMonths = (
  base: { month: number; year: number },
  offset: number,
): { month: number; year: number } => {
  const absoluteMonths = base.year * 12 + (base.month - 1) + offset;
  const targetYear = Math.floor(absoluteMonths / 12);
  const targetMonth = (absoluteMonths % 12) + 1;

  return { month: targetMonth, year: targetYear };
};

const formatMes = ({ month, year }: { month: number; year: number }): string =>
  `${String(month).padStart(2, "0")}/${year}`;

const formatVencimento = (
  day: number,
  month: number,
  year: number,
): string =>
  `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

const buildRecurringTransacoes = (
  base: TransacaoInput,
  quantidadeMeses: number,
): TransacaoInput[] => {
  const baseMes = parseMes(base.mes);
  const baseVencimento = parseVencimento(base.vencimento);
  const offsetMeses =
    (baseVencimento.year - baseMes.year) * 12 +
    (baseVencimento.month - baseMes.month);

  return Array.from({ length: quantidadeMeses }, (_, index) => {
    const mesRef = addMonths(baseMes, index);
    const vencimentoRef = addMonths(mesRef, offsetMeses);
    const ultimoDiaMes = new Date(
      vencimentoRef.year,
      vencimentoRef.month,
      0,
    ).getDate();
    const safeDay = Math.min(baseVencimento.day, ultimoDiaMes);

    return {
      ...base,
      mes: formatMes(mesRef),
      vencimento: formatVencimento(
        safeDay,
        vencimentoRef.month,
        vencimentoRef.year,
      ),
    };
  });
};

export const TransacaoModal: React.FC<TransacaoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transacao,
  isEditing = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [formData, setFormData] = useState<TransacaoInput>({
    mes: "",
    vencimento: "",
    tipo: "DESPESA",
    categoria_id: 0,
    descricao_id: 0,
    banco_id: 0,
    situacao: "PENDENTE",
    valor: 0,
  });
  const [quantidadeMeses, setQuantidadeMeses] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [descricoes, setDescricoes] = useState<Descricao[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

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
  } = useFormFeedback<TransacaoField>(transacaoFields);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [categories],
  );

  const sortedDescricoes = useMemo(
    () => [...descricoes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [descricoes],
  );

  const sortedBanks = useMemo(
    () => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [banks],
  );

  const toMonthInput = (mes: string): string => {
    if (/^\d{2}\/\d{4}$/.test(mes)) {
      const [month, year] = mes.split("/");
      return `${year}-${month}`;
    }
    if (/^\d{4}-\d{2}$/.test(mes)) {
      return mes;
    }
    return "";
  };

  const fromMonthInput = (value: string): string => {
    if (!value) return "";
    const [year, month] = value.split("-");
    return `${month}/${year}`;
  };

  const toDateInput = (vencimento: string): string => {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(vencimento)) {
      const [day, month, year] = vencimento.split("/");
      return `${year}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
      return vencimento;
    }
    return "";
  };

  const fromDateInput = (value: string): string => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  const loadBanks = async () => {
    try {
      const response = await bankService.getAll({ limit: 999 });
      setBanks(response.data || []);
    } catch {
      setGeneralError("Não foi possível carregar os bancos.");
    }
  };

  const loadCategoriesByType = async (
    tipo: "DESPESA" | "RECEITA",
    selectedCategoriaId?: number,
  ) => {
    try {
      const response = await categoryService.getAll({ tipo, limit: 999 });
      setCategories(response.data || []);
      setDescricoes([]);
      setFormData((prev) => {
        const next = {
          ...prev,
          categoria_id: selectedCategoriaId ?? 0,
          descricao_id: 0,
        };

        if (Object.values(touched).some(Boolean)) {
          setFieldErrors(validateTransacaoForm(next));
        }

        return next;
      });
    } catch {
      setGeneralError("Não foi possível carregar as categorias.");
    }
  };

  const loadDescricoesByCategory = async (
    categoria_id: number,
    selectedDescricaoId?: number,
  ) => {
    if (categoria_id <= 0) {
      setDescricoes([]);
      setFormData((prev) => {
        const next = {
          ...prev,
          descricao_id: 0,
        };

        if (Object.values(touched).some(Boolean)) {
          setFieldErrors(validateTransacaoForm(next));
        }

        return next;
      });
      return;
    }

    try {
      const response = await descricaoService.getAll({
        categoria_id,
        limit: 999,
      });
      setDescricoes(response.data || []);
      setFormData((prev) => {
        const next = {
          ...prev,
          descricao_id: selectedDescricaoId ?? 0,
        };

        if (Object.values(touched).some(Boolean)) {
          setFieldErrors(validateTransacaoForm(next));
        }

        return next;
      });
    } catch {
      setGeneralError("Não foi possível carregar as descrições.");
    }
  };

  useEffect(() => {
    const initializeModal = async () => {
      if (!isOpen) return;

      clearAllErrors();
      resetTouched();

      await loadBanks();

      if (transacao && isEditing) {
        setQuantidadeMeses(1);
        const nextData: TransacaoInput = {
          mes: transacao.mes,
          vencimento: transacao.vencimento,
          tipo: transacao.tipo,
          categoria_id: transacao.categoria_id,
          descricao_id: transacao.descricao_id,
          banco_id: transacao.banco_id,
          situacao: transacao.situacao,
          valor: Number(transacao.valor),
        };

        setFormData(nextData);
        await loadCategoriesByType(transacao.tipo, transacao.categoria_id);
        await loadDescricoesByCategory(
          transacao.categoria_id,
          transacao.descricao_id,
        );
      } else {
        setQuantidadeMeses(1);
        setFormData({
          mes: "",
          vencimento: "",
          tipo: "DESPESA",
          categoria_id: 0,
          descricao_id: 0,
          banco_id: 0,
          situacao: "PENDENTE",
          valor: 0,
        });
        await loadCategoriesByType("DESPESA");
      }
    };

    initializeModal();
  }, [isOpen, transacao, isEditing]);

  useAccessibleModal({
    isOpen,
    modalRef,
    onClose,
  });

  const updateField = <K extends keyof TransacaoInput>(
    field: K,
    value: TransacaoInput[K],
  ) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    } as TransacaoInput;

    setFormData(nextFormData);

    if (generalError) {
      clearGeneralError();
    }

    if (touched[field as TransacaoField] || Object.values(touched).some(Boolean)) {
      setFieldErrors(validateTransacaoForm(nextFormData));
    }
  };

  const handleFieldBlur = (field: TransacaoField) => {
    markFieldTouched(field);
    setFieldErrors(validateTransacaoForm(formData));
  };

  const handleTypeChange = (tipo: "DESPESA" | "RECEITA") => {
    updateField("tipo", tipo);
    loadCategoriesByType(tipo);
  };

  const handleCategoryChange = (categoria_id: number) => {
    updateField("categoria_id", categoria_id);
    loadDescricoesByCategory(categoria_id);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearGeneralError();

    const nextFieldErrors = validateTransacaoForm(formData);
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      focusFirstInvalidField(formRef, nextFieldErrors, transacaoFields);
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing && transacao) {
        await transacaoService.update(transacao.id, formData);
        onSuccess(`Transação de ${formData.mes} atualizada com sucesso.`);
      } else {
        if (
          !Number.isInteger(quantidadeMeses) ||
          quantidadeMeses < 1 ||
          quantidadeMeses > 12
        ) {
          setGeneralError("A quantidade de meses deve estar entre 1 e 12.");
          return;
        }

        const lancamentos = buildRecurringTransacoes(formData, quantidadeMeses);

        for (const lancamento of lancamentos) {
          await transacaoService.create(lancamento);
        }

        if (lancamentos.length === 1) {
          onSuccess(`Transação de ${formData.mes} criada com sucesso.`);
        } else {
          onSuccess(
            `${lancamentos.length} transações criadas de ${lancamentos[0].mes} até ${lancamentos[lancamentos.length - 1].mes}.`,
          );
        }
      }

      onClose();
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<TransacaoField>(
        error,
        "Erro ao salvar transação.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(formRef, normalized.fieldErrors, transacaoFields);
      } else {
        setGeneralError(normalized.generalMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay">
      <div
        ref={modalRef}
        className="app-modal-content w-[95%] max-w-4xl p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="mb-6 flex items-center justify-between border-b border-[rgb(var(--app-border-default))] pb-4">
          <h2
            id={titleId}
            className="text-xl font-semibold text-[rgb(var(--app-text-primary))]"
          >
            {isEditing ? "Editar Transação" : "Nova Transação"}
          </h2>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <TextField
                id="mes"
                name="mes"
                type="month"
                label="Mês"
                variant="outlined"
                size="small"
                fullWidth
                value={toMonthInput(formData.mes)}
                onChange={(e) => updateField("mes", fromMonthInput(e.target.value))}
                onBlur={() => handleFieldBlur("mes")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("mes")}
                helperText={shouldShowError("mes") ? fieldErrors.mes : ""}
              />
            </div>

            <div>
              <TextField
                id="vencimento"
                name="vencimento"
                type="date"
                label="Vencimento"
                variant="outlined"
                size="small"
                fullWidth
                value={toDateInput(formData.vencimento)}
                onChange={(e) =>
                  updateField("vencimento", fromDateInput(e.target.value))
                }
                onBlur={() => handleFieldBlur("vencimento")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("vencimento")}
                helperText={
                  shouldShowError("vencimento") ? fieldErrors.vencimento : ""
                }
              />
            </div>
          </div>

          {!isEditing && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <TextField
                  id="quantidade_meses"
                  name="quantidade_meses"
                  type="number"
                  label="Quantidade de meses"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={quantidadeMeses}
                  onChange={(e) => {
                    const parsed = Number(e.target.value);
                    if (!Number.isFinite(parsed)) {
                      setQuantidadeMeses(1);
                      return;
                    }
                    const safe = Math.min(12, Math.max(1, Math.trunc(parsed)));
                    setQuantidadeMeses(safe);
                  }}
                  inputProps={{ min: 1, max: 12, step: 1 }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Inclui o mês informado e os próximos meses."
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <TextField
                id="tipo"
                name="tipo"
                select
                label="Tipo"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.tipo}
                onChange={(e) => handleTypeChange(e.target.value as "DESPESA" | "RECEITA")}
                onBlur={() => handleFieldBlur("tipo")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("tipo")}
                helperText={shouldShowError("tipo") ? fieldErrors.tipo : ""}
              >
                <MenuItem value="DESPESA">Despesa</MenuItem>
                <MenuItem value="RECEITA">Receita</MenuItem>
              </TextField>
            </div>

            <div>
              <TextField
                id="situacao"
                name="situacao"
                select
                label="Situação"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.situacao}
                onChange={(e) =>
                  updateField("situacao", e.target.value as "PENDENTE" | "PAGO")
                }
                onBlur={() => handleFieldBlur("situacao")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("situacao")}
                helperText={
                  shouldShowError("situacao") ? fieldErrors.situacao : ""
                }
              >
                <MenuItem value="PAGO">Pago</MenuItem>
                <MenuItem value="PENDENTE">Pendente</MenuItem>
              </TextField>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <TextField
                id="categoria_id"
                name="categoria_id"
                select
                label="Categoria"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.categoria_id}
                onChange={(e) => handleCategoryChange(Number(e.target.value))}
                onBlur={() => handleFieldBlur("categoria_id")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("categoria_id")}
                helperText={
                  shouldShowError("categoria_id") ? fieldErrors.categoria_id : ""
                }
              >
                <MenuItem value={0}>Selecione...</MenuItem>
                {sortedCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            <div>
              <TextField
                id="descricao_id"
                name="descricao_id"
                select
                label="Descrição"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.descricao_id}
                onChange={(e) => updateField("descricao_id", Number(e.target.value))}
                onBlur={() => handleFieldBlur("descricao_id")}
                disabled={formData.categoria_id <= 0}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("descricao_id")}
                helperText={
                  shouldShowError("descricao_id") ? fieldErrors.descricao_id : ""
                }
              >
                <MenuItem value={0}>Selecione uma categoria primeiro</MenuItem>
                {sortedDescricoes.map((desc) => (
                  <MenuItem key={desc.id} value={desc.id}>
                    {desc.nome}
                  </MenuItem>
                ))}
              </TextField>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <TextField
                id="banco_id"
                name="banco_id"
                select
                label="Banco"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.banco_id}
                onChange={(e) => updateField("banco_id", Number(e.target.value))}
                onBlur={() => handleFieldBlur("banco_id")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("banco_id")}
                helperText={
                  shouldShowError("banco_id") ? fieldErrors.banco_id : ""
                }
              >
                <MenuItem value={0}>Selecione...</MenuItem>
                {sortedBanks.map((bank) => (
                  <MenuItem key={bank.id} value={bank.id}>
                    {bank.nome}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            <div>
              <TextField
                id="valor"
                name="valor"
                type="number"
                label="Valor"
                variant="outlined"
                size="small"
                fullWidth
                inputProps={{ step: "0.01" }}
                value={formData.valor || ""}
                onChange={(e) => updateField("valor", Number(e.target.value))}
                onBlur={() => handleFieldBlur("valor")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("valor")}
                helperText={shouldShowError("valor") ? fieldErrors.valor : ""}
              />
            </div>
          </div>

          <FormErrorSummary generalMessage={generalError} />

          <div className="flex justify-end gap-3 pt-4">
            <AppButton
              type="button"
              onClick={onClose}
              tone="outline-danger"
              startIcon={<Ban size={16} />}
              disabled={isSubmitting}
            >
              Cancelar
            </AppButton>
            <AppButton
              type="submit"
              disabled={isSubmitting}
              tone="primary"
              startIcon={<Save size={16} />}
            >
              {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
};
