import { useEffect, useId, useRef, type ReactNode } from "react";
import { BsX } from "react-icons/bs";

export type ConfirmTone = "danger" | "neutral" | "success";

type ConfirmSheetProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmIcon?: ReactNode;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Só o botão de ação, como o erro que precisa ser lido. */
  alertOnly?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const confirmClass: Record<ConfirmTone, string> = {
  danger: "ds-sheet-calm",
  neutral: "ds-sheet-fix",
  success: "ds-sheet-success",
};

/**
 * Confirmação da agenda do manager. No perigo, o foco começa em Cancelar
 * e o confirmar fica claro, com a tinta vermelha.
 */
export default function ConfirmSheet({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmIcon,
  cancelLabel = "Cancelar",
  tone = "success",
  alertOnly = false,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      if (tone === "danger" && !alertOnly) {
        cancelRef.current?.focus();
        return;
      }
      confirmRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, tone, alertOnly]);

  if (!isOpen) return null;

  const confirmSurface = alertOnly ? "ds-sheet-danger" : confirmClass[tone];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-canvas p-5 pb-[calc(0.75rem+max(1.25rem,env(safe-area-inset-bottom,0px)))] text-fg sm:rounded-2xl sm:p-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-fg/20 sm:hidden" />
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h2 id={titleId} className="min-w-0 text-lg font-semibold leading-6">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span className="flex size-full items-center justify-center">
              <BsX size={24} aria-hidden className="block" />
            </span>
          </button>
        </div>
        <div id={descriptionId} className="mb-5 text-base leading-5 text-fg-muted">
          {description}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:w-auto sm:min-w-44 ${confirmSurface}`}
          >
            <span className="flex w-full items-center justify-center gap-2">
              {confirmIcon ? (
                <span className="inline-flex shrink-0 items-center justify-center leading-none [&_svg]:block">
                  {confirmIcon}
                </span>
              ) : null}
              <span className="text-center leading-none">{confirmLabel}</span>
            </span>
          </button>
          {!alertOnly ? (
            <button
              ref={cancelRef}
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-base font-semibold text-fg-muted hover:bg-fg/10 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:w-auto"
            >
              <span className="flex w-full items-center justify-center text-center leading-none">
                {cancelLabel}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
