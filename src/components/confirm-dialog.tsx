"use client";

import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useDialogFocus } from "@/lib/use-dialog-focus";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  /** "destructive" for irreversible actions (delete, reject, take offline). */
  variant?: "default" | "destructive";
};

export function ConfirmDialog({ open, onConfirm, onCancel, title, description, confirmText = "Ya, Lanjutkan", cancelText = "Batal", loading, variant = "default" }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useDialogFocus(open, dialogRef, onCancel);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
        className="relative z-10 mx-4 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-popover p-6 text-popover-foreground shadow-2xl"
      >
        <h3 id={`${id}-title`} className="text-lg font-bold text-foreground">{title}</h3>
        <div id={`${id}-desc`} className="mt-2 text-sm text-muted-foreground break-words">{description}</div>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            className={variant === "destructive" ? "flex-1 bg-red-600 text-white hover:bg-red-700" : "flex-1"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
