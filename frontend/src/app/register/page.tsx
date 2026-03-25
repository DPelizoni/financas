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

export default function RegisterPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
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

    if (!nome || !email || !senha || !confirmarSenha) {
      setFeedback({ type: "error", message: "Preencha todos os campos." });
      return;
    }

    if (senha.length < 6) {
      setFeedback({
        type: "error",
        message: "A senha deve ter no minimo 6 caracteres.",
      });
      return;
    }

    if (senha !== confirmarSenha) {
      setFeedback({
        type: "error",
        message: "A confirmacao de senha nao confere.",
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
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              InputLabelProps={{ shrink: true }}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              InputLabelProps={{ shrink: true }}
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
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Minimo de 6 caracteres"
              InputLabelProps={{ shrink: true }}
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
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha"
              InputLabelProps={{ shrink: true }}
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
