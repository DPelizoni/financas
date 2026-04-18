"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Tags,
  FileText,
  ArrowLeftRight,
  Users,
  Wallet,
  TrendingUp,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { authService } from "@/services/authService";
import ThemeToggle from "@/components/ThemeToggle";

interface AppShellProps {
  children: React.ReactNode;
}

interface NavLinkItem {
  type: "link";
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroupItem {
  type: "group";
  id: string;
  label: string;
  icon: LucideIcon;
  baseHref: string;
  children: Array<{
    label: string;
    href: string;
  }>;
}

type NavItem = NavLinkItem | NavGroupItem;

const navItems: NavItem[] = [
  { type: "link", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { type: "link", label: "Bancos", href: "/banks", icon: Landmark },
  { type: "link", label: "Categorias", href: "/categories", icon: Tags },
  { type: "link", label: "Descrições", href: "/descricoes", icon: FileText },
  { type: "link", label: "Transações", href: "/transacoes", icon: ArrowLeftRight },
  {
    type: "group",
    id: "investimentos",
    label: "Investimentos",
    icon: TrendingUp,
    baseHref: "/investimentos",
    children: [
      { label: "Dashboard", href: "/investimentos/dashboard" },
      { label: "Ativos", href: "/investimentos/ativos" },
      { label: "Movimentações", href: "/investimentos/movimentacoes" },
    ],
  },
  { type: "link", label: "Usuários", href: "/usuarios", icon: Users },
];

const DESKTOP_SIDEBAR_STORAGE_KEY = "financas.desktop-sidebar-collapsed";

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/banks")) return "Bancos";
  if (pathname.startsWith("/categories")) return "Categorias";
  if (pathname.startsWith("/descricoes")) return "Descrições";
  if (pathname.startsWith("/transacoes")) return "Transações";
  if (pathname.startsWith("/investimentos/dashboard")) {
    return "Dashboard de Investimentos";
  }
  if (pathname.startsWith("/investimentos/movimentacoes")) {
    return "Movimentações de Investimento";
  }
  if (pathname.startsWith("/investimentos/ativos")) {
    return "Ativos de Investimento";
  }
  if (pathname.startsWith("/investimentos")) return "Investimentos";
  if (pathname.startsWith("/usuarios")) return "Usuários";
  return "Finanças";
};

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);
  const [hasLoadedSidebarPreference, setHasLoadedSidebarPreference] =
    useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [isManager, setIsManager] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  const handleMouseEnter = (id: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredGroupId(id);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredGroupId(null);
    }, 150); // Pequeno delay para facilitar a transição do mouse para o menu
  };

  // Carrega a preferência de colapso do sidebar
  useEffect(() => {
    const storedState = window.localStorage.getItem(
      DESKTOP_SIDEBAR_STORAGE_KEY,
    );
    setIsDesktopSidebarCollapsed(storedState === "true");
    setHasLoadedSidebarPreference(true);
  }, []);

  // Salva a preferência de colapso do sidebar
  useEffect(() => {
    if (!hasLoadedSidebarPreference) return;
    window.localStorage.setItem(
      DESKTOP_SIDEBAR_STORAGE_KEY,
      String(isDesktopSidebarCollapsed),
    );
  }, [hasLoadedSidebarPreference, isDesktopSidebarCollapsed]);

  // Carrega dados do usuário
  useEffect(() => {
    const user = authService.getStoredUser();
    if (!user) return;

    if (user.nome) {
      setUserName(user.nome);
    }

    setIsManager(user.role === "GESTOR" || user.role === "ADMIN");
  }, []);

  // Inteligência de Navegação: Abre o grupo automaticamente se uma sub-rota estiver ativa
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.type === "group") {
        const isChildActive = item.children.some((child) =>
          pathname.startsWith(child.href),
        );
        if (isChildActive) {
          setOpenGroups((prev) => ({
            ...prev,
            [item.id]: true,
          }));
        }
      }
    });
  }, [pathname]);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.type === "link" && item.href === "/usuarios") {
        return isManager;
      }
      return true;
    });
  }, [isManager]);

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="app-page">
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
          className={`fixed inset-y-0 left-0 z-40 w-60 transform border-r border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))] transition-all duration-300 lg:translate-x-0 ${
            isDesktopSidebarCollapsed ? "lg:w-20" : "lg:w-60"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-16 items-center justify-between border-b border-[rgb(var(--app-border-default))] px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[rgb(var(--app-brand-primary))] text-[rgb(var(--app-text-inverse))]">
                <Wallet size={18} />
              </div>
              <div className={isDesktopSidebarCollapsed ? "lg:hidden" : ""}>
                <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--app-text-muted))]">
                  Sistema
                </p>
                <h1 className="text-lg font-bold text-[rgb(var(--app-text-primary))]">
                  Finanças
                </h1>
              </div>
            </div>
            <button
              type="button"
              className="app-control-button p-1 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu lateral"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1 px-3 py-5">
            {visibleNavItems.map((item) => {
              const GroupIcon = item.icon;
              const groupIsActive = item.type === "group" && pathname.startsWith(item.baseHref);
              
              // Em desktop colapsado, mostramos apenas o ícone. 
              // Mas no mobile (sidebarOpen) ou desktop expandido, mostramos tudo.
              const showFullNavigation = !isDesktopSidebarCollapsed || sidebarOpen;

              if (item.type === "link") {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={!showFullNavigation ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[rgb(var(--app-brand-primary))] text-[rgb(var(--app-text-inverse))] shadow-sm"
                        : "text-[rgb(var(--app-text-secondary))] hover:bg-[rgb(var(--app-bg-muted))] hover:text-[rgb(var(--app-text-primary))]"
                    } ${
                      !showFullNavigation ? "lg:justify-center lg:px-2" : ""
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400`}
                  >
                    <Icon size={18} />
                    <span className={!showFullNavigation ? "lg:hidden" : ""}>
                      {item.label}
                    </span>
                  </Link>
                );
              }

              // Lógica de Grupo
              const isGroupOpen = openGroups[item.id] ?? false;

              if (!showFullNavigation) {
                const firstChild = item.children[0];
                return (
                  <div 
                    key={item.id} 
                    className="relative group/nav"
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={firstChild.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-center rounded-md px-2 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        groupIsActive
                          ? "bg-[rgb(var(--app-brand-primary))] text-[rgb(var(--app-text-inverse))] shadow-sm"
                          : "text-[rgb(var(--app-text-secondary))] hover:bg-[rgb(var(--app-bg-muted))] hover:text-[rgb(var(--app-text-primary))]"
                      }`}
                    >
                      <GroupIcon size={18} />
                    </Link>

                    {/* Menu Flutuante para Sidebar Recolhido */}
                    {hoveredGroupId === item.id && (
                      <div 
                        className="absolute left-full top-0 z-50 pl-2 w-52 animate-in fade-in slide-in-from-left-2 duration-200"
                        onMouseEnter={() => handleMouseEnter(item.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="rounded-lg border border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))] p-1 shadow-xl ring-1 ring-black/5">
                          <div className="border-b border-[rgb(var(--app-border-default))] px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--app-text-muted))]">
                              {item.label}
                            </p>
                          </div>
                          <div className="py-1">
                            {item.children.map((child) => {
                              const childIsActive = pathname.startsWith(child.href);
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => {
                                    setSidebarOpen(false);
                                    setHoveredGroupId(null);
                                  }}
                                  className={`block px-3 py-2 text-sm transition-colors hover:bg-[rgb(var(--app-bg-muted))] ${
                                    childIsActive
                                      ? "font-bold text-[rgb(var(--app-brand-primary))]"
                                      : "text-[rgb(var(--app-text-secondary))] hover:text-[rgb(var(--app-text-primary))]"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      groupIsActive
                        ? "bg-[rgb(var(--app-brand-primary))] text-[rgb(var(--app-text-inverse))] shadow-sm"
                        : "text-[rgb(var(--app-text-secondary))] hover:bg-[rgb(var(--app-bg-muted))] hover:text-[rgb(var(--app-text-primary))]"
                    }`}
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [item.id]: !isGroupOpen,
                      }))
                    }
                  >
                    <span className="flex items-center gap-3">
                      <GroupIcon size={18} />
                      {item.label}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isGroupOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isGroupOpen && (
                    <div className="space-y-1 pl-9">
                      {item.children.map((child) => {
                        const childIsActive = pathname.startsWith(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                              childIsActive
                                ? "bg-[rgb(var(--app-bg-muted))] font-semibold text-[rgb(var(--app-text-primary))]"
                                : "text-[rgb(var(--app-text-secondary))] hover:bg-[rgb(var(--app-bg-muted))] hover:text-[rgb(var(--app-text-primary))]"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-[rgb(var(--app-border-default))] p-4">
            <div
              className={`app-surface-muted p-3 ${
                isDesktopSidebarCollapsed ? "lg:flex lg:justify-center" : ""
              }`}
              title={isDesktopSidebarCollapsed ? "Produção Local" : undefined}
            >
              <p
                className={`text-xs font-semibold text-[rgb(var(--app-text-muted))] ${
                  isDesktopSidebarCollapsed ? "lg:hidden" : ""
                }`}
              >
                Ambiente
              </p>
              <p
                className={`text-sm font-medium text-[rgb(var(--app-text-secondary))] ${
                  isDesktopSidebarCollapsed ? "lg:hidden" : ""
                }`}
              >
                Produção Local
              </p>
              <p
                className={`hidden text-xs font-semibold text-[rgb(var(--app-text-muted))] ${
                  isDesktopSidebarCollapsed ? "lg:block" : ""
                }`}
              >
                Local
              </p>
            </div>
          </div>
        </aside>

        <div
          className={`flex min-h-screen flex-1 flex-col min-w-0 transition-all duration-300 ${
            isDesktopSidebarCollapsed ? "lg:pl-20" : "lg:pl-60"
          }`}
        >
          <header className="sticky top-0 z-20 border-b border-[rgb(var(--app-border-default))] bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="app-control-button p-1 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu lateral"
                >
                  <Menu size={20} />
                </button>
                <button
                  type="button"
                  className="app-control-button hidden items-center justify-center p-1 lg:inline-flex"
                  onClick={() =>
                    setIsDesktopSidebarCollapsed((previous) => !previous)
                  }
                  aria-label={
                    isDesktopSidebarCollapsed
                      ? "Expandir menu lateral"
                      : "Recolher menu lateral"
                  }
                  title={
                    isDesktopSidebarCollapsed
                      ? "Expandir menu lateral"
                      : "Recolher menu lateral"
                  }
                >
                  {isDesktopSidebarCollapsed ? (
                    <ChevronRight size={20} />
                  ) : (
                    <ChevronLeft size={20} />
                  )}
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[rgb(var(--app-text-muted))]">
                    Painel
                  </p>
                  <h2 className="text-lg font-semibold text-[rgb(var(--app-text-primary))]">
                    {pageTitle}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="hidden rounded-full bg-[rgb(var(--app-brand-primary))] px-3 py-1 text-xs font-semibold text-[rgb(var(--app-text-inverse))] sm:block">
                  {userName}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="app-button-outline-danger inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
