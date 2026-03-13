"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import FeedbackAlert from "@/components/FeedbackAlert";
import { TextField } from "@mui/material";

export default function LoginPage() {
  const authFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
      "&.Mui-focused fieldset": {
        borderColor: "#06b6d4",
      },
    },
  };
  const router = useRouter();
  const [nextRoute, setNextRoute] = useState("/dashboard");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !senha) {
      setFeedback({ type: "error", message: "Informe email e senha." });
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
        error?.response?.data?.message || "Não foi possível realizar login.";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.2),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.2),transparent_35%)]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Sistema Financeiro
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acesse sua conta para continuar.
          </p>
        </div>

        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <TextField
              id="email"
              type="email"
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              sx={authFieldSx}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              sx={authFieldSx}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-cyan-700 hover:text-cyan-800"
          >
            Criar usuário
          </Link>
        </p>
      </div>
    </div>
  );
}
