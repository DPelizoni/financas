"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { categoryService } from "@/services/categoryService";
import { Category, CategoryInput } from "@/types/category";
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
  const modalFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
    },
  };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            {category ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {errors.geral && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
              sx={modalFieldSx}
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
              sx={modalFieldSx}
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
                className="h-10 w-20 cursor-pointer rounded border border-gray-300"
              />
              <TextField
                type="text"
                label="Cor"
                variant="outlined"
                size="small"
                fullWidth
                sx={modalFieldSx}
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
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
              Categoria ativa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Salvando..." : category ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
