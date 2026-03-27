"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { authService } from "@/services/authService";
import FeedbackAlert from "@/components/FeedbackAlert";
import ThemeToggle from "@/components/ThemeToggle";
import { TextField } from "@mui/material";
import AppButton from "@/components/AppButton";

type LoginField = "email" | "senha";

const validateLoginFields = (
  values: Record<LoginField, string>,
): Record<LoginField, string> => {
  const errors: Record<LoginField, string> = {
    email: "",
    senha: "",
  };

  if (!values.email.trim()) {
    errors.email = "Informe o email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Informe um email valido.";
  }

  if (!values.senha.trim()) {
    errors.senha = "Informe a senha.";
  }

  return errors;
};

export default function LoginPage() {
  const router = useRouter();
  const [nextRoute, setNextRoute] = useState("/dashboard");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [touched, setTouched] = useState<Record<LoginField, boolean>>({
    email: false,
    senha: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<LoginField, string>>({
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors = validateLoginFields({ email, senha });
    setTouched({ email: true, senha: true });
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.email || nextFieldErrors.senha) {
      setFeedback({ type: "error", message: "Revise os campos destacados." });
      return;
    }

    try {
      setLoading(true);
      await authService.login({ email, senha });
      setFeedback({ type: "success", message: "Login realizado com sucesso." });
      router.replace(nextRoute);
      router.refresh();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Nao foi possivel realizar login.";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
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

        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <TextField
            id="email"
            type="email"
            label="Email"
            variant="outlined"
            size="small"
            fullWidth
            value={email}
            onChange={(e) => {
              const nextEmail = e.target.value;
              setEmail(nextEmail);
              if (touched.email || touched.senha) {
                setFieldErrors(validateLoginFields({ email: nextEmail, senha }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, email: true }));
              setFieldErrors(validateLoginFields({ email, senha }));
            }}
            autoComplete="email"
            placeholder="voce@empresa.com"
            InputLabelProps={{ shrink: true }}
            error={touched.email && Boolean(fieldErrors.email)}
            helperText={touched.email ? fieldErrors.email : ""}
          />

          <TextField
            id="senha"
            type="password"
            label="Senha"
            variant="outlined"
            size="small"
            fullWidth
            value={senha}
            onChange={(e) => {
              const nextSenha = e.target.value;
              setSenha(nextSenha);
              if (touched.email || touched.senha) {
                setFieldErrors(validateLoginFields({ email, senha: nextSenha }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, senha: true }));
              setFieldErrors(validateLoginFields({ email, senha }));
            }}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            InputLabelProps={{ shrink: true }}
            error={touched.senha && Boolean(fieldErrors.senha)}
            helperText={touched.senha ? fieldErrors.senha : ""}
          />

          <AppButton
            type="submit"
            tone="primary"
            fullWidth
            disabled={loading}
            startIcon={<LogIn size={16} />}
            className="h-11"
          >
            {loading ? "Entrando..." : "Entrar"}
          </AppButton>
        </form>

        <p className="mt-5 text-center text-sm text-[rgb(var(--app-text-secondary))]">
          Ainda nao tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-[rgb(var(--app-brand-primary))] hover:text-[rgb(var(--app-brand-primary-hover))]"
          >
            Criar usuario
          </Link>
        </p>
      </div>
    </div>
  );
}
