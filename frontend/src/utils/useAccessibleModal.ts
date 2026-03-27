"use client";

import { RefObject, useEffect } from "react";

interface UseAccessibleModalOptions {
  isOpen: boolean;
  modalRef: RefObject<HTMLElement>;
  onClose?: () => void;
  closeOnEscape?: boolean;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const isFocusableVisible = (element: HTMLElement): boolean => {
  if (element.hasAttribute("hidden")) return false;
  return element.offsetParent !== null || element.getClientRects().length > 0;
};

const findFocusableElements = (container: HTMLElement): HTMLElement[] => {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isFocusableVisible,
  );
};

export const useAccessibleModal = ({
  isOpen,
  modalRef,
  onClose,
  closeOnEscape = true,
}: UseAccessibleModalOptions) => {
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    const focusInitialElement = () => {
      const preferredTarget =
        modalElement.querySelector<HTMLElement>("[data-modal-initial-focus]") ??
        findFocusableElements(modalElement)[0];

      if (preferredTarget) {
        preferredTarget.focus();
        return;
      }

      if (modalElement.tabIndex < 0) {
        modalElement.focus();
      }
    };

    focusInitialElement();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = findFocusableElements(modalElement);
      if (focusables.length === 0) {
        event.preventDefault();
        modalElement.focus();
        return;
      }

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!current || current === firstFocusable || !modalElement.contains(current)) {
          event.preventDefault();
          lastFocusable.focus();
        }
        return;
      }

      if (!current || current === lastFocusable || !modalElement.contains(current)) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    modalElement.addEventListener("keydown", onKeyDown);

    return () => {
      modalElement.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, modalRef, onClose, closeOnEscape]);
};
