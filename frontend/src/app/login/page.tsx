"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogIn } from "lucide-react";
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

const loginFields = ["email", "senha"] as const;
type LoginField = (typeof loginFields)[number];

const validateLoginFields = (
  values: Record<LoginField, string>,
): FormFieldErrors<LoginField> => {
  const errors: FormFieldErrors<LoginField> = {};

  if (!values.email.trim()) {
    errors.email = "Informe o e-mail.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!values.senha.trim()) {
    errors.senha = "Informe a senha.";
  }

  return errors;
};

export default function LoginPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [nextRoute, setNextRoute] = useState("/dashboard");
  const [values, setValues] = useState<Record<LoginField, string>>({
    email: "",
    senha: "",
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
  } = useFormFeedback<LoginField>(loginFields);

  const { feedback, showFeedback, clearFeedback } = usePageFeedback();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const next = new URLSearchParams(window.location.search).get("next");
      if (next) {
        setNextRoute(next);
      }
    }

    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const updateField = (field: LoginField, value: string) => {
    const nextValues = {
      ...values,
      [field]: value,
    };

    setValues(nextValues);

    if (generalError) {
      clearGeneralError();
    }

    if (touched[field] || Object.values(touched).some(Boolean)) {
      setFieldErrors(validateLoginFields(nextValues));
    }
  };

  const handleFieldBlur = (field: LoginField) => {
    markFieldTouched(field);
    setFieldErrors(validateLoginFields(values));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearFeedback();
    clearGeneralError();

    const nextFieldErrors = validateLoginFields(values);
    markAllTouched();
    setFieldErrors(nextFieldErrors);

    if (hasFormFieldErrors(nextFieldErrors)) {
      setGeneralError(null);
      focusFirstInvalidField(formRef, nextFieldErrors, loginFields);
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.login({
        email: values.email.trim(),
        senha: values.senha,
      });
      showFeedback("success", "Login realizado com sucesso.");
      router.replace(nextRoute);
      router.refresh();
    } catch (error: unknown) {
      const normalized = normalizeApiFormError<LoginField>(
        error,
        "Não foi possível realizar login.",
      );

      setFieldErrors(normalized.fieldErrors);

      if (hasFormFieldErrors(normalized.fieldErrors)) {
        setGeneralError(null);
        focusFirstInvalidField(formRef, normalized.fieldErrors, loginFields);
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
            "radial-gradient(circle at 15% 20%, rgb(var(--app-brand-secondary) / 0.16), transparent 35%), radial-gradient(circle at 80% 0%, rgb(var(--app-brand-primary) / 0.18), transparent 32%), radial-gradient(circle at 50% 80%, rgb(var(--app-semantic-info) / 0.14), transparent 35%)",
        }}
      />

      <div
        className="app-surface relative z-10 w-full max-w-md border p-8 backdrop-blur-sm"
        style={{ boxShadow: "var(--app-shadow-lg)" }}
      >
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted))]">
            Sistema Financeiro
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[rgb(var(--app-text-primary))]">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--app-text-secondary))]">
            Acesse sua conta para continuar.
          </p>
        </div>

        <FeedbackAlert feedback={feedback} onClose={clearFeedback} />

        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
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
            autoComplete="email"
            InputLabelProps={{ shrink: true }}
            error={shouldShowError("email")}
            helperText={shouldShowError("email") ? fieldErrors.email : ""}
          />

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
            autoComplete="current-password"
            InputLabelProps={{ shrink: true }}
            error={shouldShowError("senha")}
            helperText={shouldShowError("senha") ? fieldErrors.senha : ""}
          />

          <FormErrorSummary generalMessage={generalError} />

          <AppButton
            type="submit"
            tone="primary"
            fullWidth
            disabled={isSubmitting}
            startIcon={<LogIn size={16} />}
            className="h-11"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </AppButton>
        </form>

        <p className="mt-5 text-center text-sm text-[rgb(var(--app-text-secondary))]">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-[rgb(var(--app-brand-primary))] hover:text-[rgb(var(--app-brand-primary-hover))]"
          >
            Criar usuário
          </Link>
        </p>
      </div>
    </div>
  );
}
