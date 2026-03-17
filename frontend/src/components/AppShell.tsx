"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Tags,
  FileText,
  ArrowLeftRight,
  Users,
  Wallet,
  Menu,
  X,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { authService } from "@/services/authService";
import ThemeToggle from "@/components/ThemeToggle";

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bancos", href: "/banks", icon: Landmark },
  { label: "Categorias", href: "/categories", icon: Tags },
  { label: "Descrições", href: "/descricoes", icon: FileText },
  { label: "Transações", href: "/transacoes", icon: ArrowLeftRight },
  { label: "Usuários", href: "/usuarios", icon: Users },
];

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/banks")) return "Bancos";
  if (pathname.startsWith("/categories")) return "Categorias";
  if (pathname.startsWith("/descricoes")) return "Descrições";
  if (pathname.startsWith("/transacoes")) return "Transações";
  if (pathname.startsWith("/usuarios")) return "Usuários";
  return "Finanças";
};

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [isManager, setIsManager] = useState(false);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  useEffect(() => {
    const user = authService.getStoredUser();
    if (!user) return;

    if (user.nome) {
      setUserName(user.nome);
    }

    setIsManager(user.role === "GESTOR" || user.role === "ADMIN");
  }, []);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => item.href !== "/usuarios" || isManager);
  }, [isManager]);

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-30 bg-black/40 focus-visible:outline-none"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 transform border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sistema
                </p>
                <h1 className="text-lg font-bold text-slate-900">Finanças</h1>
              </div>
            </div>
            <button
              type="button"
              className="rounded p-1 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu lateral"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1 px-3 py-5">
            {visibleNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-700 hover:bg-slate-100"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Ambiente</p>
              <p className="text-sm font-medium text-slate-800">
                Produção Local
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded p-1 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu lateral"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Painel
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {pageTitle}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="hidden rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white sm:block">
                  {userName}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
