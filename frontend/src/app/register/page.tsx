"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { TextField } from "@mui/material";
import AppButton from "@/components/AppButton";
import FeedbackAlert from "@/components/FeedbackAlert";
import ThemeToggle from "@/components/ThemeToggle";
import FormErrorSummary from "@/forms/components/FormErrorSummary";
import { authFieldSx } from "@/forms/core/auth-field-sx";
import {
  focusFirstInvalidField,
  FormFieldErrors,
  hasFormFieldErrors,
  normalizeApiFormError,
} from "@/forms/core/form-error";
import { useFormFeedback } from "@/forms/hooks/useFormFeedback";
import { usePageFeedback } from "@/forms/hooks/usePageFeedback";
import { authService } from "@/services/authService";

const registerFields = ["nome", "email", "senha", "confirmarSenha"] as const;
type RegisterField = (typeof registerFields)[number];

const validateRegisterFields = (
  values: Record<RegisterField, string>,
): FormFieldErrors<RegisterField> => {
  const errors: FormFieldErrors<RegisterField> = {};

  if (!values.nome.trim()) {
    errors.nome = "Informe o nome.";
  } else if (values.nome.trim().length < 2) {
    errors.nome = "Nome deve ter no minimo 2 caracteres.";
  }

  if (!values.email.trim()) {
    errors.email = "Informe o email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Informe um email valido.";
  }

  if (!values.senha) {
    errors.senha = "Informe a senha.";
  } else if (values.senha.length < 6) {
    errors.senha = "A senha deve ter no minimo 6 caracteres.";
  }

  if (!values.confirmarSenha) {
    errors.confirmarSenha = "Confirme a senha.";
  } else if (values.confirmarSenha !== values.senha) {
    errors.confirmarSenha = "A confirmacao de senha nao confere.";
  }

  return errors;
};

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<RegisterField, string>>({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

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
    shouldShowError,
  } = useFormFeedback<RegisterField>(registerFields);

  const { feedback, showFeedback, clearFeedback } = usePageFeedback();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const updateField = (field: RegisterField, value: string) => {
    const nextValues = {
      ...values,
      [field]: value,
    };

    setValues(nextValues);

    if (generalError) {
      clearGeneralError();
    }

    if (touched[field] || Object.values(touched).some(Boolean)) {
      setFieldErrors(validateRegisterFields(nextValues));
    }
  };

  const handleFieldBlur = (field: RegisterField) => {
    markFieldTouched(field);
    setFieldErrors(validateRegisterFields(values));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearFeedback();
    clearGeneralError();

    const nextFieldErrors = validateRegisterFields(values);
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      setGeneralError(null);
      focusFirstInvalidField(formRef, nextFieldErrors, registerFields);
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.register({
        nome: values.nome.trim(),
        email: values.email.trim(),
        senha: values.senha,
      });
      showFeedback("success", "Usuario cadastrado com sucesso.");
      router.replace("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<RegisterField>(
        error,
        "Nao foi possivel cadastrar o usuario.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(formRef, normalized.fieldErrors, registerFields);
      } else {
        setGeneralError(normalized.generalMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgb(var(--app-semantic-success) / 0.16), transparent 35%), radial-gradient(circle at 80% 0%, rgb(var(--app-brand-secondary) / 0.2), transparent 30%), radial-gradient(circle at 50% 80%, rgb(var(--app-brand-primary) / 0.16), transparent 35%)",
        }}
      />

      <div
        className="app-surface relative z-10 w-full max-w-lg border p-8 backdrop-blur-sm"
        style={{ boxShadow: "var(--app-shadow-lg)" }}
      >
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted))]">
            Sistema Financeiro
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[rgb(var(--app-text-primary))]">
            Criar Usuario
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--app-text-secondary))]">
            Cadastre um usuario para acessar o sistema.
          </p>
        </div>

        <FeedbackAlert feedback={feedback} onClose={clearFeedback} />

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
          noValidate
        >
          <div className="md:col-span-2">
            <TextField
              id="nome"
              name="nome"
              type="text"
              label="Nome"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={values.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              onBlur={() => handleFieldBlur("nome")}
              placeholder="Nome completo"
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("nome")}
              helperText={shouldShowError("nome") ? fieldErrors.nome : ""}
            />
          </div>

          <div className="md:col-span-2">
            <TextField
              id="email"
              name="email"
              type="email"
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={values.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              placeholder="voce@empresa.com"
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("email")}
              helperText={shouldShowError("email") ? fieldErrors.email : ""}
            />
          </div>

          <div>
            <TextField
              id="senha"
              name="senha"
              type="password"
              label="Senha"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={values.senha}
              onChange={(e) => updateField("senha", e.target.value)}
              onBlur={() => handleFieldBlur("senha")}
              placeholder="Minimo de 6 caracteres"
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("senha")}
              helperText={shouldShowError("senha") ? fieldErrors.senha : ""}
            />
          </div>

          <div>
            <TextField
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              label="Confirmar senha"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={values.confirmarSenha}
              onChange={(e) => updateField("confirmarSenha", e.target.value)}
              onBlur={() => handleFieldBlur("confirmarSenha")}
              placeholder="Repita a senha"
              InputLabelProps={{ shrink: true }}
              error={shouldShowError("confirmarSenha")}
              helperText={
                shouldShowError("confirmarSenha")
                  ? fieldErrors.confirmarSenha
                  : ""
              }
            />
          </div>

          <div className="md:col-span-2">
            <FormErrorSummary generalMessage={generalError} />
          </div>

          <div className="md:col-span-2">
            <AppButton
              type="submit"
              tone="success"
              fullWidth
              disabled={isSubmitting}
              startIcon={<UserPlus size={16} />}
              className="h-11"
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar usuario"}
            </AppButton>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-[rgb(var(--app-text-secondary))]">
          Ja possui conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[rgb(var(--app-semantic-success))] hover:opacity-90"
          >
            Ir para login
          </Link>
        </p>
      </div>
    </div>
  );
}
