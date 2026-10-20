"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

// Modal dialog behaviour: lock body scroll, focus the first control, trap Tab,
// close on Escape, and restore focus to the opener on close.
export function useDialogFocus(open: boolean, panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) || []);

    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => (focusables()[0] ?? panel)?.focus(), 0);

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", keyHandler);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, panelRef, onClose]);
}
