"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { descricaoService } from "@/services/descricaoService";
import { categoryService } from "@/services/categoryService";
import { Descricao, DescricaoInput } from "@/types/descricao";
import { Category } from "@/types/category";

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
        await onSave("Descrição atualizada com sucesso.");
      } else {
        const payload: DescricaoInput = {
          nome: formData.nome.trim(),
          categoria_id: formData.categoria_id,
          ativo: formData.ativo,
        };

        await descricaoService.create(payload);
        await onSave("Descrição criada com sucesso.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            {descricao ? "Editar Descrição" : "Nova Descrição"}
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nome da Descrição <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                errors.nome ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: Supermercado, Padaria"
            />
            {errors.nome && (
              <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Categoria <span className="text-red-500">*</span>
            </label>
            {categoriesLoading ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Carregando categorias...
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-red-300 bg-red-50">
                <p className="text-sm text-red-600">
                  Nenhuma categoria disponível
                </p>
              </div>
            ) : (
              <select
                value={formData.categoria_id}
                onChange={(e) =>
                  handleChange("categoria_id", Number(e.target.value))
                }
                className={`w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                  errors.categoria_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value={0}>Selecione uma categoria</option>
                {sortedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome} ({cat.tipo})
                  </option>
                ))}
              </select>
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
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
              Descrição ativa
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
              disabled={loading || categoriesLoading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
