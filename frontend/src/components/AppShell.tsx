"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Tags,
  FileText,
  ArrowLeftRight,
  Users,
  Wallet,
  PieChart,
  Repeat,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { authService } from "@/services/authService";
import UserMenu from "@/components/UserMenu";
import { UserRole } from "@/types/auth";

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  id: string;
  label: string;
  managerOnly?: boolean;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    id: "visao-geral",
    label: "Visão geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Transações", href: "/transacoes", icon: ArrowLeftRight },
    ],
  },
  {
    id: "investimentos",
    label: "Investimentos",
    items: [
      { label: "Dashboard", href: "/investimentos/dashboard", icon: PieChart },
      { label: "Ativos", href: "/investimentos/ativos", icon: Wallet },
      { label: "Movimentações", href: "/investimentos/movimentacoes", icon: Repeat },
    ],
  },
  {
    id: "cadastros",
    label: "Cadastros",
    items: [
      { label: "Bancos", href: "/banks", icon: Landmark },
      { label: "Categorias", href: "/categories", icon: Tags },
      { label: "Descrições", href: "/descricoes", icon: FileText },
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    managerOnly: true,
    items: [{ label: "Usuários", href: "/usuarios", icon: Users }],
  },
];

const DESKTOP_SIDEBAR_STORAGE_KEY = "financas.desktop-sidebar-collapsed";
const IS_DEV = process.env.NODE_ENV !== "production";

const isRouteActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const getBreadcrumb = (pathname: string): BreadcrumbItem[] => {
  for (const section of navSections) {
    const item = section.items.find((navItem) => isRouteActive(pathname, navItem.href));
    if (item) {
      return [{ label: section.label }, { label: item.label, href: item.href }];
    }
  }
  return [{ label: "Finanças" }];
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
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const breadcrumb = useMemo(() => getBreadcrumb(pathname), [pathname]);

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

    if (user.nome) setUserName(user.nome);
    setUserEmail(user.email || "");
    setUserRole(user.role);
  }, []);

  // Fecha o menu lateral mobile com Esc
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const isManager = userRole === "GESTOR" || userRole === "ADMIN";

  const visibleSections = useMemo(
    () => navSections.filter((section) => !section.managerOnly || isManager),
    [isManager],
  );

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/login");
    router.refresh();
  };

  // Em desktop recolhido mostramos apenas os ícones; no mobile o menu é sempre completo
  const showFullNavigation = !isDesktopSidebarCollapsed || sidebarOpen;

  return (
    <div className="app-page">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-30 bg-[rgb(var(--app-overlay-rgb)/0.56)] focus-visible:outline-none lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-60 transform flex-col border-r border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))] transition-all duration-300 lg:translate-x-0 ${
            isDesktopSidebarCollapsed ? "lg:w-20" : "lg:w-60"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[rgb(var(--app-border-default))] px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[rgb(var(--app-brand-primary))] text-[rgb(var(--app-text-inverse))]">
                <Wallet size={18} />
              </div>
              <div className={`flex items-center gap-2 ${!showFullNavigation ? "lg:hidden" : ""}`}>
                <span className="text-lg font-bold text-[rgb(var(--app-text-primary))]">
                  Finanças
                </span>
                {IS_DEV && <span className="app-badge-warning">DEV</span>}
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

          <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 py-4">
            {visibleSections.map((section, sectionIndex) => (
              <div key={section.id} className={sectionIndex > 0 ? "mt-5" : ""}>
                {showFullNavigation ? (
                  <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--app-text-muted))]">
                    {section.label}
                  </p>
                ) : (
                  sectionIndex > 0 && (
                    <div
                      aria-hidden="true"
                      className="mx-3 mb-3 border-t border-[rgb(var(--app-border-subtle))]"
                    />
                  )
                )}

                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = isRouteActive(pathname, item.href);
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          aria-label={!showFullNavigation ? `${section.label}: ${item.label}` : undefined}
                          title={!showFullNavigation ? `${section.label}: ${item.label}` : undefined}
                          className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))] ${
                            isActive
                              ? "bg-[rgb(var(--app-brand-primary)/0.1)] font-semibold text-[rgb(var(--app-brand-primary))] before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-[rgb(var(--app-brand-primary))]"
                              : "font-medium text-[rgb(var(--app-text-secondary))] hover:bg-[rgb(var(--app-bg-muted))] hover:text-[rgb(var(--app-text-primary))]"
                          } ${!showFullNavigation ? "lg:justify-center lg:px-2" : ""}`}
                        >
                          <Icon size={18} className="shrink-0" />
                          <span className={!showFullNavigation ? "lg:hidden" : ""}>
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div
          className={`flex min-h-screen flex-1 flex-col min-w-0 transition-all duration-300 ${
            isDesktopSidebarCollapsed ? "lg:pl-20" : "lg:pl-60"
          }`}
        >
          <header className="sticky top-0 z-20 border-b border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface)/0.95)] backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
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

                <nav aria-label="Trilha de navegação" className="min-w-0">
                  <ol className="flex min-w-0 items-center gap-1.5 text-sm">
                    {breadcrumb.map((crumb, index) => {
                      const isLast = index === breadcrumb.length - 1;
                      return (
                        <Fragment key={`${crumb.label}-${index}`}>
                          {index > 0 && (
                            <li aria-hidden="true" className="hidden text-[rgb(var(--app-text-muted))] sm:block">
                              <ChevronRight size={14} />
                            </li>
                          )}
                          <li
                            className={`truncate ${
                              isLast
                                ? "font-medium text-[rgb(var(--app-text-primary))]"
                                : "hidden text-[rgb(var(--app-text-muted))] sm:block"
                            }`}
                            aria-current={isLast ? "page" : undefined}
                          >
                            {crumb.label}
                          </li>
                        </Fragment>
                      );
                    })}
                  </ol>
                </nav>
              </div>

              <UserMenu
                nome={userName}
                email={userEmail}
                role={userRole}
                onLogout={handleLogout}
              />
            </div>
          </header>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
