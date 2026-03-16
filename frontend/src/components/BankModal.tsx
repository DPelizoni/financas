"use client";

import { useState, useEffect } from "react";
import { Ban, Save, X } from "lucide-react";
import { bankService } from "@/services/bankService";
import { Bank, BankInput } from "@/types/bank";
import AppButton from "@/components/AppButton";
import { TextField } from "@mui/material";

interface BankModalProps {
  bank: Bank | null;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

export default function BankModal({ bank, onClose, onSave }: BankModalProps) {
  const modalFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
    },
  };
  const [formData, setFormData] = useState<BankInput>({
    nome: "",
    codigo: "",
    cor: "#3B82F6",
    icone: "",
    saldo_inicial: 0,
    ativo: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saldoDisplay, setSaldoDisplay] = useState("0,00");
  const [originalBank, setOriginalBank] = useState<Bank | null>(null);

  const formatBrlInput = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const parseBrlInput = (value: string): number => {
    if (!value || typeof value !== "string") return 0;
    const cleaned = value.trim().replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) && parsed >= 0
      ? Math.round(parsed * 100) / 100
      : 0;
  };

  const valueToNumber = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) && value >= 0
        ? Math.round(value * 100) / 100
        : 0;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return 0;

      // Detectar se é formato brasileiro (1.234,56) ou inglês (1234.56)
      // Se tem vírgula, é definitivamente brasileiro
      if (trimmed.includes(",")) {
        return parseBrlInput(trimmed);
      }

      // Se tem ponto e a última parte após o ponto tem 1-2 dígitos, é provavelmente decimal inglês
      if (trimmed.includes(".")) {
        const parts = trimmed.split(".");
        const afterDot = parts[parts.length - 1];
        // Se tem 1-2 dígitos após o último ponto, é decimal (inglês)
        if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
          const parsed = parseFloat(trimmed);
          return Number.isFinite(parsed) && parsed >= 0
            ? Math.round(parsed * 100) / 100
            : 0;
        }
      }

      // Sem ponto ou vírgula, é número inteiro ou número simples
      const parsed = parseFloat(trimmed);
      return Number.isFinite(parsed) && parsed >= 0
        ? Math.round(parsed * 100) / 100
        : 0;
    }
    return 0;
  };

  useEffect(() => {
    if (bank) {
      const currentSaldo = valueToNumber(bank.saldo_inicial);
      setFormData({
        nome: bank.nome,
        codigo: bank.codigo || "",
        cor: bank.cor,
        icone: bank.icone || "",
        saldo_inicial: currentSaldo,
        ativo: bank.ativo,
      });
      setOriginalBank(bank);

      const displayValue = formatBrlInput(currentSaldo);
      setSaldoDisplay(displayValue);
    } else {
      setOriginalBank(null);
      setSaldoDisplay(formatBrlInput(0));
    }
  }, [bank]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter no mínimo 2 caracteres";
    }

    if (formData.cor && !/^#[0-9A-Fa-f]{6}$/.test(formData.cor)) {
      newErrors.cor = "Cor deve estar no formato hexadecimal (#RRGGBB)";
    }

    if (formData.saldo_inicial && formData.saldo_inicial < 0) {
      newErrors.saldo_inicial = "Saldo inicial não pode ser negativo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      if (originalBank) {
        const updates: Partial<BankInput> = {};
        const trimmedNome = formData.nome.trim();
        const trimmedCodigo = formData.codigo?.trim() || "";
        const trimmedIcone = formData.icone?.trim() || "";
        const currentSaldo = valueToNumber(formData.saldo_inicial);
        const originalSaldo = valueToNumber(originalBank.saldo_inicial);
        if (trimmedNome !== originalBank.nome) updates.nome = trimmedNome;
        if (trimmedCodigo !== (originalBank.codigo || "")) {
          updates.codigo = trimmedCodigo || undefined;
        }
        if (formData.cor !== originalBank.cor) updates.cor = formData.cor;
        if (trimmedIcone !== (originalBank.icone || "")) {
          updates.icone = trimmedIcone || undefined;
        }
        if (Math.abs(currentSaldo - originalSaldo) > 0.01) {
          updates.saldo_inicial = currentSaldo;
        }
        if (formData.ativo !== originalBank.ativo)
          updates.ativo = formData.ativo;
        if (Object.keys(updates).length === 0) {
          setErrors({
            geral: "Nenhuma alteração foi identificada para salvar.",
          });
          return;
        }

        await bankService.update(originalBank.id, updates);
        await onSave(
          "Banco atualizado com sucesso. As alterações foram salvas.",
        );
      } else {
        const payload: BankInput = {
          nome: formData.nome.trim(),
          codigo: formData.codigo?.trim() || undefined,
          cor: formData.cor,
          icone: formData.icone?.trim() || undefined,
          saldo_inicial: valueToNumber(formData.saldo_inicial),
          ativo: formData.ativo,
        };
        await bankService.create(payload);
        await onSave("Banco criado com sucesso. Cadastro concluído.");
      }
    } catch (error: any) {
      console.error("Erro ao salvar banco:", error);

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

  const handleChange = (field: keyof BankInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {bank ? "Editar Banco" : "Novo Banco"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.geral && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.geral}
            </p>
          )}

          {/* Nome */}
          <div>
            <TextField
              type="text"
              label="Nome do Banco *"
              autoFocus
              variant="outlined"
              size="small"
              fullWidth
              sx={modalFieldSx}
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Ex: Nubank, Itaú, Bradesco"
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.nome)}
              helperText={errors.nome}
            />
          </div>

          {/* Código */}
          <div>
            <TextField
              type="text"
              label="Código do Banco"
              variant="outlined"
              size="small"
              fullWidth
              sx={modalFieldSx}
              value={formData.codigo}
              onChange={(e) => handleChange("codigo", e.target.value)}
              placeholder="Ex: 260, 341"
              InputLabelProps={{ shrink: true }}
            />
          </div>

          {/* Cor */}
          <div>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => handleChange("cor", e.target.value)}
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
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
                placeholder="#3B82F6"
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.cor)}
                helperText={errors.cor}
              />
            </div>
          </div>

          {/* Saldo Inicial */}
          <div>
            <TextField
              type="text"
              label="Saldo Inicial"
              inputMode="decimal"
              variant="outlined"
              size="small"
              fullWidth
              sx={modalFieldSx}
              value={saldoDisplay}
              onChange={(e) => {
                const inputValue = e.target.value;
                const parsedValue = parseBrlInput(inputValue);
                setSaldoDisplay(inputValue);
                handleChange("saldo_inicial", parsedValue);
              }}
              onBlur={() => {
                const formatted = formatBrlInput(formData.saldo_inicial || 0);
                setSaldoDisplay(formatted);
              }}
              placeholder="0,00"
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.saldo_inicial)}
              helperText={errors.saldo_inicial}
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => handleChange("ativo", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
              Banco ativo
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <AppButton
              type="button"
              onClick={onClose}
              tone="outline"
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
              {loading ? "Salvando..." : bank ? "Atualizar" : "Criar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
