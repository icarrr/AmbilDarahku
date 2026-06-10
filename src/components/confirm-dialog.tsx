"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
};

export function ConfirmDialog({ open, onConfirm, onCancel, title, description, confirmText = "Ya, Lanjutkan", cancelText = "Batal", loading }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative z-10 mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={onConfirm} disabled={loading}>
            {loading ? "Memproses..." : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
