"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FeedbackAlert from "@/components/FeedbackAlert";
import { authService } from "@/services/authService";

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nome || !email || !senha || !confirmarSenha) {
      setFeedback({ type: "error", message: "Preencha todos os campos." });
      return;
    }

    if (senha.length < 6) {
      setFeedback({
        type: "error",
        message: "A senha deve ter no mínimo 6 caracteres.",
      });
      return;
    }

    if (senha !== confirmarSenha) {
      setFeedback({
        type: "error",
        message: "A confirmação de senha não confere.",
      });
      return;
    }

    try {
      setLoading(true);
      await authService.register({ nome, email, senha });
      setFeedback({
        type: "success",
        message: "Usuário cadastrado com sucesso.",
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Não foi possível cadastrar o usuário.";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.22),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.2),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.2),transparent_35%)]" />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Sistema Financeiro
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Criar Usuário
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre um usuário para acessar o sistema.
          </p>
        </div>

        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label
              htmlFor="nome"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Nome
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Nome completo"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="voce@empresa.com"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Mínimo de 6 caracteres"
            />
          </div>

          <div>
            <label
              htmlFor="confirmarSenha"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirmar senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Repita a senha"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Cadastrando..." : "Cadastrar usuário"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Já possui conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Ir para login
          </Link>
        </p>
      </div>
    </div>
  );
}
