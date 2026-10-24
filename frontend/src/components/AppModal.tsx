"use client";

import { MouseEvent, ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import AppButton from "@/components/AppButton";
import { useAccessibleModal } from "@/utils/useAccessibleModal";

type AppModalSize = "sm" | "md" | "lg" | "xl";

interface AppModalProps {
  isOpen: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  // dialog: centralizado; drawer: painel lateral (tela cheia no celular), para formulários longos
  variant?: "dialog" | "drawer";
  size?: AppModalSize;
  // Quando true, fechar pede confirmação para descartar as alterações
  dirty?: boolean;
  // Ícone/elemento opcional antes do título
  headerIcon?: ReactNode;
}

const dialogSizes: Record<AppModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const drawerSizes: Record<AppModalSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
};

/**
 * Modal padrão do sistema.
 * - Renderiza em portal, trava a rolagem da página e devolve o foco ao fechar.
 * - Fecha com Esc, com o "×" e com qualquer botão interno marcado com `data-modal-close`.
 * - Com `dirty`, pede confirmação antes de descartar alterações não salvas.
 */
export default function AppModal({
  isOpen,
  title,
  description,
  onClose,
  children,
  variant = "dialog",
  size = "md",
  dirty = false,
  headerIcon,
}: AppModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  useEffect(() => setMounted(true), []);

  const requestClose = () => {
    if (dirty) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  // Função estável: o hook de acessibilidade refaz o foco inicial quando onClose muda
  const escapeHandlerRef = useRef<() => void>(() => {});
  escapeHandlerRef.current = confirmingDiscard ? () => setConfirmingDiscard(false) : requestClose;
  const handleEscape = useCallback(() => escapeHandlerRef.current(), []);

  useAccessibleModal({
    isOpen,
    modalRef: panelRef,
    onClose: handleEscape,
  });

  // Trava a rolagem da página e devolve o foco ao elemento que abriu o modal
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setConfirmingDiscard(false);
  }, [isOpen]);

  useEffect(() => {
    if (confirmingDiscard) keepEditingRef.current?.focus();
  }, [confirmingDiscard]);

  if (!isOpen || !mounted) return null;

  // Botões internos com data-modal-close (ex.: "Cancelar") passam pela mesma checagem do "×"
  const handlePanelClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest("[data-modal-close]");
    if (target && panelRef.current?.contains(target)) {
      event.preventDefault();
      requestClose();
    }
  };

  const isDrawer = variant === "drawer";

  return createPortal(
    <div className={isDrawer ? "app-modal-overlay app-modal-overlay-drawer" : "app-modal-overlay"}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={handlePanelClick}
        className={
          isDrawer
            ? `app-modal-content app-drawer-panel relative flex h-full w-full flex-col ${drawerSizes[size]}`
            : `app-modal-content app-dialog-panel relative flex max-h-[90vh] w-full flex-col ${dialogSizes[size]}`
        }
      >
        <div className="app-modal-header shrink-0 gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {headerIcon}
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-[rgb(var(--app-text-primary))]">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-[rgb(var(--app-text-secondary))]">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="app-control-button flex h-9 w-9 shrink-0 items-center justify-center border-transparent"
            aria-label="Fechar"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="app-modal-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>

        {confirmingDiscard && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgb(var(--app-overlay-rgb)/0.45)] p-4">
            <div
              role="alertdialog"
              aria-labelledby={`${titleId}-discard`}
              className="app-surface w-full max-w-sm p-5"
              style={{ boxShadow: "var(--app-shadow-lg)" }}
            >
              <div className="flex items-start gap-3">
                <div className="app-badge-warning shrink-0 rounded-full p-2">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 id={`${titleId}-discard`} className="text-base font-semibold text-[rgb(var(--app-text-primary))]">
                    Descartar alterações?
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--app-text-secondary))]">
                    As alterações feitas neste formulário ainda não foram salvas e serão perdidas.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <AppButton ref={keepEditingRef} tone="outline" onClick={() => setConfirmingDiscard(false)}>
                  Continuar editando
                </AppButton>
                <AppButton
                  tone="danger"
                  onClick={() => {
                    setConfirmingDiscard(false);
                    onClose();
                  }}
                >
                  Descartar
                </AppButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
