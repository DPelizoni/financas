"use client";

import { useEffect, useId, useRef, useState } from "react";
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

const userFields = ["nome", "email", "senha", "confirmarSenha", "status", "role"] as const;
type UserField = (typeof userFields)[number];

const validateUserForm = (
  values: UserFormState,
  isEditing: boolean,
): FormFieldErrors<UserField> => {
  const errors: FormFieldErrors<UserField> = {};

  if (!values.nome || values.nome.trim().length < 2) {
    errors.nome = "Nome deve ter no mínimo 2 caracteres.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  const isKeepingCurrentPassword =
    isEditing &&
    (values.senha === PASSWORD_PLACEHOLDER || values.senha.trim() === "") &&
    (values.confirmarSenha === PASSWORD_PLACEHOLDER ||
      values.confirmarSenha.trim() === "");

  if (!isEditing || !isKeepingCurrentPassword) {
    if (!values.senha || values.senha.length < 6) {
      errors.senha = "Senha deve ter no mínimo 6 caracteres.";
    }

    if (values.confirmarSenha !== values.senha) {
      errors.confirmarSenha = "A confirmação de senha não confere.";
    }
  }

  return errors;
};

export default function UserModal({
  isOpen,
  user,
  isAdmin,
  onClose,
  onSave,
}: UserModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [formData, setFormData] = useState<UserFormState>(defaultFormState);

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
  } = useFormFeedback<UserField>(userFields);

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
    } else {
      setFormData(defaultFormState);
    }

    clearAllErrors();
    resetTouched();
  }, [isOpen, user, clearAllErrors, resetTouched]);

  useAccessibleModal({
    isOpen,
    modalRef,
    onClose,
  });

  const updateField = <K extends keyof UserFormState>(
    field: K,
    value: UserFormState[K],
  ) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    } as UserFormState;

    setFormData(nextFormData);

    if (generalError) {
      clearGeneralError();
    }

    if (touched[field as UserField] || Object.values(touched).some(Boolean)) {
      setFieldErrors(validateUserForm(nextFormData, Boolean(user)));
    }
  };

  const handleFieldBlur = (field: UserField) => {
    markFieldTouched(field);
    setFieldErrors(validateUserForm(formData, Boolean(user)));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearGeneralError();

    const nextFieldErrors = validateUserForm(formData, Boolean(user));
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      focusFirstInvalidField(formRef, nextFieldErrors, userFields);
      return;
    }

    try {
      setIsSubmitting(true);

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
        await onSave(`Usuário \"${payload.nome}\" atualizado com sucesso.`);
      } else {
        const payload: UserCreateInput = {
          ...basePayload,
          senha: formData.senha,
        };

        await userService.create(payload);
        await onSave(`Usuário \"${payload.nome}\" criado com sucesso.`);
      }
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<UserField>(
        error,
        "Não foi possível salvar os dados do usuário.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(formRef, normalized.fieldErrors, userFields);
      } else {
        setGeneralError(normalized.generalMessage);
      }
    } finally {
      setIsSubmitting(false);
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
            {user ? "Editar Usuário" : "Novo Usuário"}
          </h2>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
          <div>
            <TextField
              id="nome"
              name="nome"
              type="text"
              label="Nome"
              variant="outlined"
              size="small"
              fullWidth
              autoFocus
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
              id="email"
              name="email"
              type="email"
              label="E-mail"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("email")}
              helperText={shouldShowError("email") ? fieldErrors.email : ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              id="senha"
              name="senha"
              type="password"
              label="Senha"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.senha}
              onChange={(e) => updateField("senha", e.target.value)}
              onBlur={() => handleFieldBlur("senha")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("senha")}
              helperText={
                shouldShowError("senha")
                  ? fieldErrors.senha
                  : user
                    ? "Senha atual carregada. Altere apenas se desejar trocar."
                    : ""
              }
            />

            <TextField
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              label="Confirmar senha"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.confirmarSenha}
              onChange={(e) => updateField("confirmarSenha", e.target.value)}
              onBlur={() => handleFieldBlur("confirmarSenha")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("confirmarSenha")}
              helperText={
                shouldShowError("confirmarSenha")
                  ? fieldErrors.confirmarSenha
                  : user
                    ? "Mantenha como está para não alterar a senha."
                    : ""
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              id="status"
              name="status"
              select
              label="Status"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.status}
              onChange={(e) => updateField("status", e.target.value as UserStatus)}
              onBlur={() => handleFieldBlur("status")}
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("status")}
              helperText={shouldShowError("status") ? fieldErrors.status : ""}
            >
              <MenuItem value="ATIVO">Ativo</MenuItem>
              <MenuItem value="INATIVO">Inativo</MenuItem>
            </TextField>

            <TextField
              id="role"
              name="role"
              select
              label="Papel"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.role}
              onChange={(e) => updateField("role", e.target.value as UserRole)}
              onBlur={() => handleFieldBlur("role")}
              InputLabelProps={{ shrink: true }}
              disabled={!isAdmin}
              error={shouldShowError("role")}
              helperText={
                shouldShowError("role")
                  ? fieldErrors.role
                  : !isAdmin
                    ? "Somente ADMIN pode alterar papel."
                    : ""
              }
            >
              <MenuItem value="USUARIO">Usuário</MenuItem>
              <MenuItem value="GESTOR">Gestor</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </TextField>
          </div>

          <FormErrorSummary generalMessage={generalError} />

          <div className="flex justify-end gap-3 pt-2">
            <AppButton
              type="button"
              tone="outline-danger"
              onClick={onClose}
              startIcon={<Ban size={16} />}
              disabled={isSubmitting}
            >
              Cancelar
            </AppButton>
            <AppButton
              type="submit"
              startIcon={<Save size={16} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : user ? "Atualizar" : "Cadastrar"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
