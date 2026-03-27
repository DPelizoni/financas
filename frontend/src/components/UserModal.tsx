"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ban, Save } from "lucide-react";
import { MenuItem, TextField } from "@mui/material";
import AppButton from "@/components/AppButton";
import { userService } from "@/services/userService";
import {
  User,
  UserCreateInput,
  UserRole,
  UserStatus,
  UserUpdateInput,
} from "@/types/user";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

interface UserModalProps {
  isOpen: boolean;
  user: User | null;
  isAdmin: boolean;
  onClose: () => void;
  onSave: (message: string) => Promise<void> | void;
}

interface UserFormState {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  status: UserStatus;
  role: UserRole;
}

const defaultFormState: UserFormState = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  status: "ATIVO",
  role: "USUARIO",
};

const PASSWORD_PLACEHOLDER = "********";

export default function UserModal({
  isOpen,
  user,
  isAdmin,
  onClose,
  onSave,
}: UserModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [formData, setFormData] = useState<UserFormState>(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setFormData({
        nome: user.nome,
        email: user.email,
        senha: PASSWORD_PLACEHOLDER,
        confirmarSenha: PASSWORD_PLACEHOLDER,
        status: user.status,
        role: user.role,
      });
      return;
    }

    setFormData(defaultFormState);
  }, [isOpen, user]);

  useAccessibleModal({
    isOpen,
    modalRef,
    onClose,
  });

  const handleChange = (field: keyof UserFormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const isEditing = Boolean(user);

    if (!formData.nome || formData.nome.trim().length < 2) {
      nextErrors.nome = "Nome deve ter no minimo 2 caracteres.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      nextErrors.email = "Informe um email valido.";
    }

    const isKeepingCurrentPassword =
      isEditing &&
      (formData.senha === PASSWORD_PLACEHOLDER || formData.senha.trim() === "") &&
      (formData.confirmarSenha === PASSWORD_PLACEHOLDER ||
        formData.confirmarSenha.trim() === "");

    if (!isEditing || !isKeepingCurrentPassword) {
      if (!formData.senha || formData.senha.length < 6) {
        nextErrors.senha = "Senha deve ter no minimo 6 caracteres.";
      }

      if (formData.confirmarSenha !== formData.senha) {
        nextErrors.confirmarSenha = "A confirmacao de senha nao confere.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const basePayload = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        status: formData.status,
        role: isAdmin ? formData.role : user?.role || "USUARIO",
      };

      if (user) {
        const isKeepingCurrentPassword =
          (formData.senha === PASSWORD_PLACEHOLDER ||
            formData.senha.trim() === "") &&
          (formData.confirmarSenha === PASSWORD_PLACEHOLDER ||
            formData.confirmarSenha.trim() === "");

        const payload: UserUpdateInput = {
          ...basePayload,
        };

        if (!isKeepingCurrentPassword) {
          payload.senha = formData.senha;
        }

        await userService.update(user.id, payload);
        await onSave(`Usuario "${payload.nome}" atualizado com sucesso.`);
      } else {
        const payload: UserCreateInput = {
          ...basePayload,
          senha: formData.senha,
        };
        await userService.create(payload);
        await onSave(`Usuario "${payload.nome}" criado com sucesso.`);
      }
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        "Nao foi possivel salvar os dados do usuario.";
      const apiErrors = error?.response?.data?.errors;

      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const normalizedErrors: Record<string, string> = {};
        apiErrors.forEach((item: { field?: string; message?: string }) => {
          if (!item?.field || !item?.message) return;
          normalizedErrors[item.field] = item.message;
        });

        if (Object.keys(normalizedErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...normalizedErrors }));
          return;
        }
      }

      setErrors({ geral: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="app-modal-overlay">
      <div
        ref={modalRef}
        className="app-modal-content max-h-[90vh] w-full max-w-xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="app-modal-header">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {user ? "Editar Usuario" : "Novo Usuario"}
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
              label="Nome"
              variant="outlined"
              size="small"
              fullWidth
              autoFocus
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.nome)}
              helperText={errors.nome}
            />
          </div>

          <div>
            <TextField
              type="email"
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              type="password"
              label="Senha"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.senha}
              onChange={(e) => handleChange("senha", e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.senha)}
              helperText={
                errors.senha ||
                (user ? "Senha atual carregada. Altere apenas se desejar trocar." : "")
              }
            />

            <TextField
              type="password"
              label="Confirmar senha"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.confirmarSenha}
              onChange={(e) => handleChange("confirmarSenha", e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.confirmarSenha)}
              helperText={
                errors.confirmarSenha ||
                (user ? "Mantenha como esta para nao alterar a senha." : "")
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              select
              label="Status"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.status}
              onChange={(e) =>
                handleChange("status", e.target.value as UserStatus)
              }
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="ATIVO">Ativo</MenuItem>
              <MenuItem value="INATIVO">Inativo</MenuItem>
            </TextField>

            <TextField
              select
              label="Papel"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value as UserRole)}
              InputLabelProps={{ shrink: true }}
              disabled={!isAdmin}
              helperText={!isAdmin ? "Somente ADMIN pode alterar papel." : ""}
            >
              <MenuItem value="USUARIO">Usuario</MenuItem>
              <MenuItem value="GESTOR">Gestor</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </TextField>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <AppButton
              type="button"
              tone="outline-danger"
              onClick={onClose}
              startIcon={<Ban size={16} />}
              disabled={loading}
            >
              Cancelar
            </AppButton>
            <AppButton
              type="submit"
              startIcon={<Save size={16} />}
              disabled={loading}
            >
              {loading ? "Salvando..." : user ? "Atualizar" : "Cadastrar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}

