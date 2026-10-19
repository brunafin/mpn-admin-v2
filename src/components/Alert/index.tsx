import { useEffect, useId, useRef, type ReactNode } from "react";
import Button, { type ButtonVariant } from "../Button";

type AlertProps = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  confirmVariant?: Extract<ButtonVariant, "primary" | "danger">;
  onConfirm: () => void;
  dismissLabel?: string;
  onDismiss: () => void;
};

/**
 * Diálogo que interrompe a tela. O mesmo desenho da mensalidade pendente
 * no manager: véu, cartão, título e duas ações.
 */
export default function Alert({
  open,
  title,
  children,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  dismissLabel = "Depois",
  onDismiss,
}: AlertProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTarget =
      confirmVariant === "danger"
        ? "[data-alert-dismiss]"
        : "[data-alert-confirm]";
    panelRef.current
      ?.querySelector<HTMLButtonElement>(focusTarget)
      ?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismissRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, confirmVariant]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div ref={panelRef} className="w-full max-w-md rounded-2xl bg-surface p-5">
        <p id={titleId} className="text-lg font-semibold text-fg">
          {title}
        </p>
        {children ? (
          <div className="mt-2 text-base leading-6 text-fg-muted">{children}</div>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            data-alert-confirm
            variant={confirmVariant}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" data-alert-dismiss onClick={onDismiss}>
            {dismissLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
