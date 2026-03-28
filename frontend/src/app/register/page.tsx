"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import FeedbackAlert from "@/components/FeedbackAlert";
import ThemeToggle from "@/components/ThemeToggle";
import { authService } from "@/services/authService";
import { TextField } from "@mui/material";
import AppButton from "@/components/AppButton";

type RegisterField = "nome" | "email" | "senha" | "confirmarSenha";

const validateRegisterFields = (
  values: Record<RegisterField, string>,
): Record<RegisterField, string> => {
  const errors: Record<RegisterField, string> = {
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  };

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

const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "4px",
    minHeight: "44px",
    "&.MuiInputBase-sizeSmall": {
      minHeight: "44px",
    },
    "& .MuiOutlinedInput-input": {
      padding: "10px 14px",
      lineHeight: 1.4,
    },
    "&.MuiInputBase-sizeSmall .MuiOutlinedInput-input": {
      padding: "10px 14px",
    },
  },
};

export default function RegisterPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [touched, setTouched] = useState<Record<RegisterField, boolean>>({
    nome: false,
    email: false,
    senha: false,
    confirmarSenha: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<RegisterField, string>>({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const values = { nome, email, senha, confirmarSenha };
    const nextFieldErrors = validateRegisterFields(values);
    setTouched({
      nome: true,
      email: true,
      senha: true,
      confirmarSenha: true,
    });
    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFeedback({
        type: "error",
        message: "Revise os campos destacados antes de continuar.",
      });
      return;
    }

    try {
      setLoading(true);
      await authService.register({ nome, email, senha });
      setFeedback({
        type: "success",
        message: "Usuario cadastrado com sucesso.",
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Nao foi possivel cadastrar o usuario.";
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

        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <TextField
              id="nome"
              type="text"
              label="Nome"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={nome}
              onChange={(e) => {
                const nextNome = e.target.value;
                setNome(nextNome);
                if (Object.values(touched).some(Boolean)) {
                  setFieldErrors(
                    validateRegisterFields({
                      nome: nextNome,
                      email,
                      senha,
                      confirmarSenha,
                    }),
                  );
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, nome: true }));
                setFieldErrors(
                  validateRegisterFields({
                    nome,
                    email,
                    senha,
                    confirmarSenha,
                  }),
                );
              }}
              placeholder="Nome completo"
              InputLabelProps={{ shrink: true }}
              error={touched.nome && Boolean(fieldErrors.nome)}
              helperText={touched.nome ? fieldErrors.nome : ""}
            />
          </div>

          <div className="md:col-span-2">
            <TextField
              id="email"
              type="email"
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={email}
              onChange={(e) => {
                const nextEmail = e.target.value;
                setEmail(nextEmail);
                if (Object.values(touched).some(Boolean)) {
                  setFieldErrors(
                    validateRegisterFields({
                      nome,
                      email: nextEmail,
                      senha,
                      confirmarSenha,
                    }),
                  );
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, email: true }));
                setFieldErrors(
                  validateRegisterFields({
                    nome,
                    email,
                    senha,
                    confirmarSenha,
                  }),
                );
              }}
              placeholder="voce@empresa.com"
              InputLabelProps={{ shrink: true }}
              error={touched.email && Boolean(fieldErrors.email)}
              helperText={touched.email ? fieldErrors.email : ""}
            />
          </div>

          <div>
            <TextField
              id="senha"
              type="password"
              label="Senha"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={senha}
              onChange={(e) => {
                const nextSenha = e.target.value;
                setSenha(nextSenha);
                if (Object.values(touched).some(Boolean)) {
                  setFieldErrors(
                    validateRegisterFields({
                      nome,
                      email,
                      senha: nextSenha,
                      confirmarSenha,
                    }),
                  );
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, senha: true }));
                setFieldErrors(
                  validateRegisterFields({
                    nome,
                    email,
                    senha,
                    confirmarSenha,
                  }),
                );
              }}
              placeholder="Minimo de 6 caracteres"
              InputLabelProps={{ shrink: true }}
              error={touched.senha && Boolean(fieldErrors.senha)}
              helperText={touched.senha ? fieldErrors.senha : ""}
            />
          </div>

          <div>
            <TextField
              id="confirmarSenha"
              type="password"
              label="Confirmar senha"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={confirmarSenha}
              onChange={(e) => {
                const nextConfirmarSenha = e.target.value;
                setConfirmarSenha(nextConfirmarSenha);
                if (Object.values(touched).some(Boolean)) {
                  setFieldErrors(
                    validateRegisterFields({
                      nome,
                      email,
                      senha,
                      confirmarSenha: nextConfirmarSenha,
                    }),
                  );
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, confirmarSenha: true }));
                setFieldErrors(
                  validateRegisterFields({
                    nome,
                    email,
                    senha,
                    confirmarSenha,
                  }),
                );
              }}
              placeholder="Repita a senha"
              InputLabelProps={{ shrink: true }}
              error={touched.confirmarSenha && Boolean(fieldErrors.confirmarSenha)}
              helperText={touched.confirmarSenha ? fieldErrors.confirmarSenha : ""}
            />
          </div>

          <div className="md:col-span-2">
            <AppButton
              type="submit"
              tone="success"
              fullWidth
              disabled={loading}
              startIcon={<UserPlus size={16} />}
              className="h-11"
            >
              {loading ? "Cadastrando..." : "Cadastrar usuario"}
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
