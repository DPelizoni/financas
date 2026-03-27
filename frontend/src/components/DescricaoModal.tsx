"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Ban, Save } from "lucide-react";
import { descricaoService } from "@/services/descricaoService";
import { categoryService } from "@/services/categoryService";
import { Descricao, DescricaoInput } from "@/types/descricao";
import { Category } from "@/types/category";
import AppButton from "@/components/AppButton";
import { MenuItem, TextField } from "@mui/material";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface DescricaoModalProps {
  descricao: Descricao | null;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

export default function DescricaoModal({
  descricao,
  onClose,
  onSave,
}: DescricaoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
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
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        setErrors({ geral: "Não foi possível carregar as categorias." });
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (descricao) {
      setFormData({
        nome: descricao.nome,
        categoria_id: descricao.categoria_id,
        ativo: descricao.ativo,
      });
      setOriginalDescricao(descricao);
      return;
    }

    setOriginalDescricao(null);
    setFormData({
      nome: "",
      categoria_id: categories.length > 0 ? categories[0].id : 0,
      ativo: true,
    });
  }, [descricao, categories]);

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

    if (!formData.categoria_id || formData.categoria_id <= 0) {
      newErrors.categoria_id = "Selecione uma categoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof DescricaoInput, value: any) => {
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

      if (originalDescricao) {
        const updates: Partial<DescricaoInput> = {};
        const trimmedNome = formData.nome.trim();

        if (trimmedNome !== originalDescricao.nome) updates.nome = trimmedNome;
        if (formData.categoria_id !== originalDescricao.categoria_id)
          updates.categoria_id = formData.categoria_id;
        if (formData.ativo !== originalDescricao.ativo)
          updates.ativo = formData.ativo;

        if (Object.keys(updates).length === 0) {
          setErrors({
            geral: "Nenhuma alteração foi identificada para salvar.",
          });
          return;
        }

        await descricaoService.update(originalDescricao.id, updates);
        await onSave(`Descrição "${trimmedNome}" atualizada com sucesso.`);
      } else {
        const payload: DescricaoInput = {
          nome: formData.nome.trim(),
          categoria_id: formData.categoria_id,
          ativo: formData.ativo,
        };

        await descricaoService.create(payload);
        await onSave(`Descrição "${payload.nome}" criada com sucesso.`);
      }
    } catch (error: any) {
      console.error("Erro ao salvar descrição:", error);

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
            {descricao ? "Editar Descrição" : "Nova Descrição"}
          </h2>
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
              label="Nome da Descrição *"
              autoFocus
              variant="outlined"
              size="small"
              fullWidth
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Ex: Supermercado, Padaria"
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.nome)}
              helperText={errors.nome}
            />
          </div>

          <div>
            {categoriesLoading ? (
              <div className="app-surface-muted flex h-10 items-center justify-center">
                <p className="text-sm text-gray-500">
                  Carregando categorias...
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="app-inline-error flex h-10 items-center justify-center">
                <p className="text-sm text-red-600">
                  Nenhuma categoria disponível
                </p>
              </div>
            ) : (
              <TextField
                select
                label="Categoria *"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.categoria_id}
                onChange={(e) =>
                  handleChange("categoria_id", Number(e.target.value))
                }
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.categoria_id)}
              >
                <MenuItem value={0}>Selecione uma categoria</MenuItem>
                {sortedCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nome} ({cat.tipo})
                  </MenuItem>
                ))}
              </TextField>
            )}
            {errors.categoria_id && (
              <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>
            )}
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
              Descrição ativa
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
              disabled={loading || categoriesLoading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}


