"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";

// Logos em /public/bancos (fonte: github.com/Tgentil/Bancos-em-SVG).
// Cada regra casa pelo nome (sem acentos) ou pelo código COMPE do banco.
const LOGO_RULES: Array<{ logo: string; nome: RegExp; codigos: string[] }> = [
  { logo: "nubank", nome: /nubank|\bnu\b/, codigos: ["260"] },
  { logo: "itau", nome: /itau/, codigos: ["341"] },
  { logo: "bradesco", nome: /bradesco/, codigos: ["237"] },
  { logo: "bb", nome: /banco do brasil|\bbb\b/, codigos: ["001"] },
  { logo: "caixa", nome: /caixa|\bcef\b/, codigos: ["104"] },
  { logo: "inter", nome: /\binter\b/, codigos: ["077"] },
  { logo: "santander", nome: /santander/, codigos: ["033"] },
  { logo: "c6", nome: /\bc6\b/, codigos: ["336"] },
  { logo: "picpay", nome: /picpay/, codigos: ["380"] },
  { logo: "mercadopago", nome: /mercado ?pago/, codigos: ["323"] },
  { logo: "xp", nome: /\bxp\b/, codigos: ["102", "348"] },
  { logo: "btg", nome: /\bbtg/, codigos: ["208"] },
  { logo: "original", nome: /original/, codigos: ["212"] },
  { logo: "pan", nome: /\bpan\b|panamericano/, codigos: ["623"] },
  { logo: "safra", nome: /safra/, codigos: ["422"] },
  { logo: "sicoob", nome: /sicoob/, codigos: ["756"] },
  { logo: "sicredi", nome: /sicredi/, codigos: ["748"] },
  { logo: "banrisul", nome: /banrisul/, codigos: ["041"] },
  { logo: "neon", nome: /\bneon\b/, codigos: ["536", "735"] },
  { logo: "pagbank", nome: /pagbank|pagseguro/, codigos: ["290"] },
  { logo: "stone", nome: /\bstone\b/, codigos: ["197"] },
  { logo: "bv", nome: /\bbv\b|votorantim/, codigos: ["655"] },
  { logo: "bmg", nome: /\bbmg\b/, codigos: ["318"] },
  { logo: "daycoval", nome: /daycoval/, codigos: ["707"] },
  { logo: "brb", nome: /\bbrb\b|banco de brasilia/, codigos: ["070"] },
  { logo: "bnb", nome: /\bbnb\b|banco do nordeste/, codigos: ["004"] },
  { logo: "magalupay", nome: /magalu/, codigos: [] },
  { logo: "infinitepay", nome: /infinite ?pay/, codigos: ["542"] },
  { logo: "cora", nome: /\bcora\b/, codigos: ["403"] },
  { logo: "unicred", nome: /unicred/, codigos: ["136"] },
  { logo: "efi", nome: /\befi\b|gerencianet/, codigos: ["364"] },
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export const getBankLogo = (nome: string, codigo?: string | null): string | null => {
  const normalizedNome = normalize(nome);
  const byNome = LOGO_RULES.find((rule) => rule.nome.test(normalizedNome));
  if (byNome) return `/bancos/${byNome.logo}.svg`;

  const digits = (codigo || "").replace(/\D/g, "");
  if (!digits) return null;
  const normalizedCodigo = digits.padStart(3, "0");
  const byCodigo = LOGO_RULES.find((rule) => rule.codigos.includes(normalizedCodigo));
  return byCodigo ? `/bancos/${byCodigo.logo}.svg` : null;
};

interface BankLogoProps {
  nome: string;
  codigo?: string | null;
  size?: "sm" | "md";
}

export default function BankLogo({ nome, codigo, size = "md" }: BankLogoProps) {
  const [failed, setFailed] = useState(false);
  const logo = getBankLogo(nome, codigo);
  const isSmall = size === "sm";
  const sizeClass = isSmall ? "h-7 w-7" : "h-10 w-10";

  if (!logo || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-app-info-surface text-app-brand-primary shadow-sm dark:bg-blue-900/40 dark:text-blue-300 ${sizeClass}`}
        title={nome}
      >
        <Landmark size={isSmall ? 14 : 20} strokeWidth={2.25} />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-app-surface shadow-sm dark:border-slate-600 ${sizeClass}`}
      title={nome}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={`Logo ${nome}`}
        className="h-[70%] w-[70%] object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
