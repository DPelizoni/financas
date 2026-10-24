"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut, Moon } from "lucide-react";
import { useThemeMode } from "@/theme/theme-context";
import { UserRole } from "@/types/auth";

interface UserMenuProps {
  nome: string;
  email: string;
  role: UserRole | null;
  onLogout: () => void;
}

const roleLabel: Record<UserRole, string> = {
  USUARIO: "Usuário",
  GESTOR: "Gestor",
  ADMIN: "Admin",
};

const getInitials = (nome: string): string => {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};

export default function UserMenu({ nome, email, role, onLogout }: UserMenuProps) {
  const { isDarkMode, toggleMode } = useThemeMode();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openedByKeyboardRef = useRef(false);
  const menuId = useId();

  const getItems = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[role^='menuitem']") ?? [],
    );

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // Aberto pelo teclado, foca o primeiro item; pelo mouse, foca o painel sem destacar nenhum item
  useEffect(() => {
    if (!open) return;
    if (openedByKeyboardRef.current) {
      getItems()[0]?.focus();
    } else {
      menuRef.current?.focus();
    }
  }, [open]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = getItems();
    const index = items.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const previous = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
      items[previous]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const firstName = nome.trim().split(/\s+/)[0] || nome;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Menu do usuário ${nome}`}
        onClick={(event) => {
          // Cliques gerados por Enter/Espaço têm detail === 0
          openedByKeyboardRef.current = event.detail === 0;
          setOpen((prev) => !prev);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openedByKeyboardRef.current = true;
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-[rgb(var(--app-bg-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--app-brand-primary)/0.12)] text-sm font-semibold text-[rgb(var(--app-brand-primary))]">
          {getInitials(nome)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-[rgb(var(--app-text-primary))] sm:block">
          {firstName}
        </span>
        <ChevronDown
          size={16}
          className={`hidden text-[rgb(var(--app-text-muted))] transition-transform sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Opções do usuário"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className="app-surface absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] p-1 outline-none"
          style={{ boxShadow: "var(--app-shadow-md)" }}
        >
          <div className="border-b border-[rgb(var(--app-border-subtle))] px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-[rgb(var(--app-text-primary))]" title={nome}>
              {nome}
            </p>
            {email && (
              <p className="truncate text-xs text-[rgb(var(--app-text-muted))]" title={email}>
                {email}
              </p>
            )}
            {role && <span className="app-badge-info mt-2">{roleLabel[role]}</span>}
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={isDarkMode}
              onClick={toggleMode}
              className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-[rgb(var(--app-text-secondary))] transition-colors hover:bg-[rgb(var(--app-bg-muted))] hover:text-[rgb(var(--app-text-primary))] focus-visible:bg-[rgb(var(--app-bg-muted))] focus-visible:outline-none"
            >
              <span className="flex items-center gap-3">
                <Moon size={16} />
                Tema escuro
              </span>
              <span
                aria-hidden="true"
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  isDarkMode ? "bg-[rgb(var(--app-brand-primary))]" : "bg-[rgb(var(--app-border-strong))]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isDarkMode ? "translate-x-[1.125rem]" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

          <div className="border-t border-[rgb(var(--app-border-subtle))] pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-[rgb(var(--app-semantic-error))] transition-colors hover:bg-[rgb(var(--app-semantic-error)/0.1)] focus-visible:bg-[rgb(var(--app-semantic-error)/0.1)] focus-visible:outline-none"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
