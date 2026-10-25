import { Wallet } from "lucide-react";

interface AuthHeaderProps {
  title: string;
  description: string;
}

// Cabeçalho das telas de acesso, com a mesma marca do menu lateral
export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[rgb(var(--app-brand-primary))] text-[rgb(var(--app-text-inverse))]">
          <Wallet size={20} />
        </div>
        <span className="text-lg font-bold text-[rgb(var(--app-text-primary))]">Finanças</span>
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-[rgb(var(--app-text-primary))]">{title}</h1>
      <p className="mt-1 text-sm text-[rgb(var(--app-text-secondary))]">{description}</p>
    </div>
  );
}
