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
import { categoryService } from "@/services/categoryService";
import { descricaoService } from "@/services/descricaoService";
import { Category } from "@/types/category";
import { Descricao, DescricaoInput } from "@/types/descricao";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface DescricaoModalProps {
  descricao: Descricao | null;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

const categoryTipoLabel: Record<"RECEITA" | "DESPESA", string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
};

const descricaoFields = ["nome", "categoria_id", "ativo"] as const;
type DescricaoField = (typeof descricaoFields)[number];

const validateDescricaoForm = (
  values: DescricaoInput,
): FormFieldErrors<DescricaoField> => {
  const errors: FormFieldErrors<DescricaoField> = {};

  if (!values.nome || values.nome.trim().length < 2) {
    errors.nome = "Nome deve ter no minimo 2 caracteres.";
  }

  if (!values.categoria_id || values.categoria_id <= 0) {
    errors.categoria_id = "Selecione uma categoria.";
  }

  return errors;
};

export default function DescricaoModal({
  descricao,
  onClose,
  onSave,
}: DescricaoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();

  const [formData, setFormData] = useState<DescricaoInput>({
    nome: "",
    categoria_id: 0,
    ativo: true,
  });
  const [originalDescricao, setOriginalDescricao] = useState<Descricao | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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
  } = useFormFeedback<DescricaoField>(descricaoFields);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [categories],
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoryService.getAll({ limit: 100 });
        setCategories(response.data || []);
      } catch {
        setGeneralError("Nao foi possivel carregar as categorias.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [setGeneralError]);

  useEffect(() => {
    if (descricao) {
      setFormData({
        nome: descricao.nome,
        categoria_id: descricao.categoria_id,
        ativo: descricao.ativo,
      });
      setOriginalDescricao(descricao);
    } else {
      setOriginalDescricao(null);
      setFormData({
        nome: "",
        categoria_id: categories.length > 0 ? categories[0].id : 0,
        ativo: true,
      });
    }

    clearAllErrors();
    resetTouched();
  }, [descricao, categories, clearAllErrors, resetTouched]);

  useAccessibleModal({
    isOpen: true,
    modalRef,
    onClose,
  });

  const updateField = <K extends keyof DescricaoInput>(
    field: K,
    value: DescricaoInput[K],
  ) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    } as DescricaoInput;

    setFormData(nextFormData);

    if (generalError) {
      clearGeneralError();
    }

    if (touched[field as DescricaoField] || Object.values(touched).some(Boolean)) {
      setFieldErrors(validateDescricaoForm(nextFormData));
    }
  };

  const handleFieldBlur = (field: DescricaoField) => {
    markFieldTouched(field);
    setFieldErrors(validateDescricaoForm(formData));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearGeneralError();

    const nextFieldErrors = validateDescricaoForm(formData);
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      focusFirstInvalidField(formRef, nextFieldErrors, descricaoFields);
      return;
    }

    try {
      setIsSubmitting(true);

      if (originalDescricao) {
        const updates: Partial<DescricaoInput> = {};
        const trimmedNome = formData.nome.trim();

        if (trimmedNome !== originalDescricao.nome) {
          updates.nome = trimmedNome;
        }
        if (formData.categoria_id !== originalDescricao.categoria_id) {
          updates.categoria_id = formData.categoria_id;
        }
        if (formData.ativo !== originalDescricao.ativo) {
          updates.ativo = formData.ativo;
        }

        if (Object.keys(updates).length === 0) {
          setGeneralError("Nenhuma alteracao foi identificada para salvar.");
          return;
        }

        await descricaoService.update(originalDescricao.id, updates);
        await onSave(`Descricao \"${trimmedNome}\" atualizada com sucesso.`);
      } else {
        const payload: DescricaoInput = {
          nome: formData.nome.trim(),
          categoria_id: formData.categoria_id,
          ativo: formData.ativo,
        };

        await descricaoService.create(payload);
        await onSave(`Descricao \"${payload.nome}\" criada com sucesso.`);
      }
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<DescricaoField>(
        error,
        "Nao foi possivel concluir a operacao.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(formRef, normalized.fieldErrors, descricaoFields);
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
            {descricao ? "Editar Descricao" : "Nova Descricao"}
          </h2>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
          <div>
            <TextField
              id="nome"
              name="nome"
              type="text"
              label="Nome da Descricao *"
              autoFocus
              variant="outlined"
              size="small"
              fullWidth
              value={formData.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              onBlur={() => handleFieldBlur("nome")}
              placeholder="Ex: Supermercado, Padaria"
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("nome")}
              helperText={shouldShowError("nome") ? fieldErrors.nome : ""}
            />
          </div>

          <div>
            {categoriesLoading ? (
              <div className="app-surface-muted flex h-11 items-center justify-center">
                <p className="text-sm text-gray-500">Carregando categorias...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="app-inline-error flex h-11 items-center justify-center">
                <p className="text-sm text-red-600">Nenhuma categoria disponivel</p>
              </div>
            ) : (
              <TextField
                id="categoria_id"
                name="categoria_id"
                select
                label="Categoria *"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.categoria_id}
                onChange={(e) => updateField("categoria_id", Number(e.target.value))}
                onBlur={() => handleFieldBlur("categoria_id")}
                InputLabelProps={{ shrink: true }}
                error={shouldShowError("categoria_id")}
                helperText={
                  shouldShowError("categoria_id") ? fieldErrors.categoria_id : ""
                }
              >
                <MenuItem value={0}>Selecione uma categoria</MenuItem>
                {sortedCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nome} ({categoryTipoLabel[cat.tipo]})
                  </MenuItem>
                ))}
              </TextField>
            )}
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
              Descricao ativa
            </label>
          </div>

          <FormErrorSummary generalMessage={generalError} />

          <div className="flex gap-3 pt-4">
            <AppButton
              type="button"
              onClick={onClose}
              tone="outline-danger"
              fullWidth
              startIcon={<Ban size={16} />}
              disabled={isSubmitting}
            >
              Cancelar
            </AppButton>
            <AppButton
              type="submit"
              tone="primary"
              fullWidth
              startIcon={<Save size={16} />}
              disabled={isSubmitting || categoriesLoading}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
