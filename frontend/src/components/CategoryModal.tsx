"use client";

import { useEffect, useState } from "react";
import { Ban, Save, X } from "lucide-react";
import { categoryService } from "@/services/categoryService";
import { Category, CategoryInput } from "@/types/category";
import AppButton from "@/components/AppButton";
import { MenuItem, TextField } from "@mui/material";

interface CategoryModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

export default function CategoryModal({
  category,
  onClose,
  onSave,
}: CategoryModalProps) {
  const [formData, setFormData] = useState<CategoryInput>({
    nome: "",
    tipo: "DESPESA",
    cor: "#0EA5E9",
    ativo: true,
  });
  const [originalCategory, setOriginalCategory] = useState<Category | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        nome: category.nome,
        tipo: category.tipo,
        cor: category.cor,
        ativo: category.ativo,
      });
      setOriginalCategory(category);
      return;
    }

    setOriginalCategory(null);
    setFormData({
      nome: "",
      tipo: "DESPESA",
      cor: "#0EA5E9",
      ativo: true,
    });
  }, [category]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter no mínimo 2 caracteres";
    }

    if (formData.cor && !/^#[0-9A-Fa-f]{6}$/.test(formData.cor)) {
      newErrors.cor = "Cor deve estar no formato hexadecimal (#RRGGBB)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CategoryInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      if (originalCategory) {
        const updates: Partial<CategoryInput> = {};
        const trimmedNome = formData.nome.trim();

        if (trimmedNome !== originalCategory.nome) updates.nome = trimmedNome;
        if (formData.tipo !== originalCategory.tipo)
          updates.tipo = formData.tipo;
        if (formData.cor !== originalCategory.cor) updates.cor = formData.cor;
        if (formData.ativo !== originalCategory.ativo)
          updates.ativo = formData.ativo;

        if (Object.keys(updates).length === 0) {
          setErrors({
            geral: "Nenhuma alteração foi identificada para salvar.",
          });
          return;
        }

        await categoryService.update(originalCategory.id, updates);
        await onSave(
          "Categoria atualizada com sucesso. As alterações foram salvas.",
        );
      } else {
        const payload: CategoryInput = {
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          cor: formData.cor,
          ativo: formData.ativo,
        };

        await categoryService.create(payload);
        await onSave("Categoria criada com sucesso. Cadastro concluído.");
      }
    } catch (error: any) {
      console.error("Erro ao salvar categoria:", error);

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

  return (
    <div className="app-modal-overlay">
      <div className="app-modal-content max-h-[90vh] w-full max-w-md overflow-y-auto">
        <div className="app-modal-header p-6">
          <h2 className="text-xl font-bold text-gray-900">
            {category ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <button
            onClick={onClose}
            className="app-modal-close-button p-1"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {errors.geral && (
            <p className="app-inline-error">
              {errors.geral}
            </p>
          )}

          <div>
            <TextField
              type="text"
              label="Nome da Categoria *"
              autoFocus
              variant="outlined"
              size="small"
              fullWidth
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Ex: Alimentação, Salário"
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.nome)}
              helperText={errors.nome}
            />
          </div>

          <div>
            <TextField
              select
              label="Tipo *"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.tipo}
              onChange={(e) =>
                handleChange("tipo", e.target.value as "RECEITA" | "DESPESA")
              }
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="DESPESA">Despesa</MenuItem>
              <MenuItem value="RECEITA">Receita</MenuItem>
            </TextField>
          </div>

          <div>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => handleChange("cor", e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))]"
              />
              <TextField
                type="text"
                label="Cor"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.cor}
                onChange={(e) => handleChange("cor", e.target.value)}
                placeholder="#0EA5E9"
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.cor)}
                helperText={errors.cor}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => handleChange("ativo", e.target.checked)}
              className="app-checkbox"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-[rgb(var(--app-text-secondary))]">
              Categoria ativa
            </label>
          </div>

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
              {loading ? "Salvando..." : category ? "Atualizar" : "Criar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}


