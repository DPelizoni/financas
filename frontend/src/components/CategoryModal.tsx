"use client";

import { useEffect, useRef, useState } from "react";
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
import { Category, CategoryInput } from "@/types/category";
import AppModal from "@/components/AppModal";
import { useFormDirty } from "@/forms/hooks/useFormDirty";

interface CategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

const categoryFields = ["nome", "tipo", "ativo"] as const;
type CategoryField = (typeof categoryFields)[number];

const validateCategoryForm = (
  values: CategoryInput,
): FormFieldErrors<CategoryField> => {
  const errors: FormFieldErrors<CategoryField> = {};

  if (!values.nome || values.nome.trim().length < 2) {
    errors.nome = "Nome deve ter no mínimo 2 caracteres.";
  }

  return errors;
};

export default function CategoryModal({
  isOpen,
  category,
  onClose,
  onSave,
}: CategoryModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<CategoryInput>({
    nome: "",
    tipo: "DESPESA",
    ativo: true,
  });
  const [originalCategory, setOriginalCategory] = useState<Category | null>(
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
  } = useFormFeedback<CategoryField>(categoryFields);

  useEffect(() => {
    if (!isOpen) return;

    if (category) {
      setFormData({
        nome: category.nome,
        tipo: category.tipo,
        ativo: category.ativo,
      });
      setOriginalCategory(category);
    } else {
      setOriginalCategory(null);
      setFormData({
        nome: "",
        tipo: "DESPESA",
        ativo: true,
      });
    }

    clearAllErrors();
    resetTouched();
  }, [isOpen, category, clearAllErrors, resetTouched]);

  const isDirty = useFormDirty(isOpen, formData);

  if (!isOpen) return null;

  const updateField = <K extends keyof CategoryInput>(
    field: K,
    value: CategoryInput[K],
  ) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    } as CategoryInput;

    setFormData(nextFormData);

    if (generalError) {
      clearGeneralError();
    }

    if (touched[field as CategoryField] || Object.values(touched).some(Boolean)) {
      setFieldErrors(validateCategoryForm(nextFormData));
    }
  };

  const handleFieldBlur = (field: CategoryField) => {
    markFieldTouched(field);
    setFieldErrors(validateCategoryForm(formData));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearGeneralError();

    const nextFieldErrors = validateCategoryForm(formData);
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      focusFirstInvalidField(formRef, nextFieldErrors, categoryFields);
      return;
    }

    try {
      setIsSubmitting(true);

      if (originalCategory) {
        const updates: Partial<CategoryInput> = {};
        const trimmedNome = formData.nome.trim();

        if (trimmedNome !== originalCategory.nome) {
          updates.nome = trimmedNome;
        }
        if (formData.tipo !== originalCategory.tipo) {
          updates.tipo = formData.tipo;
        }
        if (formData.ativo !== originalCategory.ativo) {
          updates.ativo = formData.ativo;
        }

        if (Object.keys(updates).length === 0) {
          setGeneralError("Nenhuma alteração foi identificada para salvar.");
          return;
        }

        await categoryService.update(originalCategory.id, updates);
        await onSave(`Categoria \"${trimmedNome}\" atualizada com sucesso.`);
      } else {
        const payload: CategoryInput = {
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          ativo: formData.ativo,
        };

        await categoryService.create(payload);
        await onSave(`Categoria \"${payload.nome}\" criada com sucesso.`);
      }
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<CategoryField>(
        error,
        "Não foi possível concluir a operação.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(formRef, normalized.fieldErrors, categoryFields);
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
      title={category ? "Editar Categoria" : "Nova Categoria"}
      onClose={onClose}
      size="sm"
      dirty={isDirty}
    >

    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
      <div>
        <TextField
          id="nome"
          name="nome"
          type="text"
          label="Nome da Categoria *"
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
          id="tipo"
          name="tipo"
          select
          label="Tipo *"
          variant="outlined"
          size="small"
          fullWidth
          value={formData.tipo}
          onChange={(e) =>
            updateField("tipo", e.target.value as "RECEITA" | "DESPESA")
          }
          onBlur={() => handleFieldBlur("tipo")}
          InputLabelProps={{ shrink: true }}
          error={shouldShowError("tipo")}
          helperText={shouldShowError("tipo") ? fieldErrors.tipo : ""}
        >
          <MenuItem value="DESPESA">Despesa</MenuItem>
          <MenuItem value="RECEITA">Receita</MenuItem>
        </TextField>
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
          Categoria ativa
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
          {isSubmitting ? "Salvando..." : category ? "Atualizar" : "Criar"}
        </AppButton>
      </div>
    </form>
    </AppModal>
  );
}
