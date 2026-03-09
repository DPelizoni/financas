"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Transacao, TransacaoInput, TransacaoFilters } from "@/types/transacao";
import { Category } from "@/types/category";
import { Descricao } from "@/types/descricao";
import { Bank } from "@/types/bank";
import { transacaoService } from "@/services/transacaoService";
import { categoryService } from "@/services/categoryService";
import { descricaoService } from "@/services/descricaoService";
import { bankService } from "@/services/bankService";
import { X } from "lucide-react";

interface TransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  transacao?: Transacao;
  isEditing?: boolean;
}

export const TransacaoModal: React.FC<TransacaoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transacao,
  isEditing = false,
}) => {
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [descricoes, setDescricoes] = useState<Descricao[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Load data on mount
  useEffect(() => {
    const initializeModal = async () => {
      if (!isOpen) return;

      await loadBanks();

      if (transacao && isEditing) {
        setFormData({
          mes: transacao.mes,
          vencimento: transacao.vencimento,
          tipo: transacao.tipo,
          categoria_id: transacao.categoria_id,
          descricao_id: transacao.descricao_id,
          banco_id: transacao.banco_id,
          situacao: transacao.situacao,
          valor: Number(transacao.valor),
        });
        await loadCategoriesByType(transacao.tipo, transacao.categoria_id);
        await loadDescricoesByCategory(
          transacao.categoria_id,
          transacao.descricao_id,
        );
      } else {
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

  const loadBanks = async () => {
    try {
      const response = await bankService.getAll({ limit: 999 });
      setBanks(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
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
      setFormData((prev) => ({
        ...prev,
        categoria_id: selectedCategoriaId ?? 0,
        descricao_id: 0,
      }));
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const loadDescricoesByCategory = async (
    categoria_id: number,
    selectedDescricaoId?: number,
  ) => {
    if (categoria_id <= 0) {
      setDescricoes([]);
      return;
    }

    try {
      const response = await descricaoService.getAll({
        categoria_id,
        limit: 999,
      });
      setDescricoes(response.data || []);
      setFormData((prev) => ({
        ...prev,
        descricao_id: selectedDescricaoId ?? 0,
      }));
    } catch (error) {
      console.error("Erro ao carregar descrições:", error);
    }
  };

  const handleTypeChange = (tipo: "DESPESA" | "RECEITA") => {
    setFormData((prev) => ({
      ...prev,
      tipo,
    }));
    loadCategoriesByType(tipo);
  };

  const handleCategoryChange = (categoria_id: number) => {
    setFormData((prev) => ({
      ...prev,
      categoria_id,
    }));
    loadDescricoesByCategory(categoria_id);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.mes || !/^\d{2}\/\d{4}$/.test(formData.mes)) {
      newErrors.mes = "Mês deve estar no formato MM/AAAA";
    }

    if (
      !formData.vencimento ||
      !/^\d{2}\/\d{2}\/\d{4}$/.test(formData.vencimento)
    ) {
      newErrors.vencimento = "Vencimento deve estar no formato DD/MM/AAAA";
    }

    if (!formData.tipo) {
      newErrors.tipo = "Tipo é obrigatório";
    }

    if (formData.categoria_id <= 0) {
      newErrors.categoria_id = "Categoria é obrigatória";
    }

    if (formData.descricao_id <= 0) {
      newErrors.descricao_id = "Descrição é obrigatória";
    }

    if (formData.banco_id <= 0) {
      newErrors.banco_id = "Banco é obrigatório";
    }

    if (formData.valor <= 0) {
      newErrors.valor = "Valor deve ser maior que zero";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditing && transacao) {
        await transacaoService.update(transacao.id, formData);
        onSuccess("Transação atualizada com sucesso.");
      } else {
        await transacaoService.create(formData);
        onSuccess("Transação criada com sucesso.");
      }

      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar transação";
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[95%] max-w-4xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Editar Transação" : "Nova Transação"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mês */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mês (MM/AAAA)
              </label>
              <input
                type="month"
                value={toMonthInput(formData.mes)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mes: fromMonthInput(e.target.value),
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                  errors.mes
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.mes && (
                <p className="text-red-500 text-xs mt-1">{errors.mes}</p>
              )}
            </div>

            {/* Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimento (DD/MM/AAAA)
              </label>
              <input
                type="date"
                value={toDateInput(formData.vencimento)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vencimento: fromDateInput(e.target.value),
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                  errors.vencimento
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.vencimento && (
                <p className="text-red-500 text-xs mt-1">{errors.vencimento}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  handleTypeChange(e.target.value as "DESPESA" | "RECEITA")
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                  errors.tipo
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              >
                <option value="">Selecione...</option>
                <option value="DESPESA">Despesa</option>
                <option value="RECEITA">Receita</option>
              </select>
              {errors.tipo && (
                <p className="text-red-500 text-xs mt-1">{errors.tipo}</p>
              )}
            </div>

            {/* Situação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Situação
              </label>
              <select
                value={formData.situacao}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    situacao: e.target.value as "PENDENTE" | "PAGO",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="PAGO">Pago</option>
                <option value="PENDENTE">Pendente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={formData.categoria_id}
                onChange={(e) => handleCategoryChange(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                  errors.categoria_id
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              >
                <option value="">Selecione...</option>
                {sortedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
              {errors.categoria_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.categoria_id}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <select
                value={formData.descricao_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descricao_id: Number(e.target.value),
                  }))
                }
                disabled={formData.categoria_id <= 0}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                  errors.descricao_id
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } ${formData.categoria_id <= 0 ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Selecione uma categoria primeiro</option>
                {sortedDescricoes.map((desc) => (
                  <option key={desc.id} value={desc.id}>
                    {desc.nome}
                  </option>
                ))}
              </select>
              {errors.descricao_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.descricao_id}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banco */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banco
              </label>
              <select
                value={formData.banco_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    banco_id: Number(e.target.value),
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                  errors.banco_id
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              >
                <option value="">Selecione...</option>
                {sortedBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.nome}
                  </option>
                ))}
              </select>
              {errors.banco_id && (
                <p className="text-red-500 text-xs mt-1">{errors.banco_id}</p>
              )}
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor
              </label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.valor || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor: Number(e.target.value),
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                  errors.valor
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.valor && (
                <p className="text-red-500 text-xs mt-1">{errors.valor}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
