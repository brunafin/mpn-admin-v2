import type { ReactNode } from "react";
import { buttonClassName } from "../Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center px-6 py-16 ${className}`}
    >
      <p className="text-center text-sm font-medium text-fg">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-center text-sm leading-5 text-fg-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex w-full max-w-xs justify-center">{action}</div>}
    </div>
  );
}

/** CTA padrão secondary para empty states. */
export function emptyStateActionClassName(extra = "") {
  return buttonClassName({
    variant: "secondary",
    size: "md",
    fullWidth: false,
    className: extra,
  });
}

/** Vazio dentro de uma superfície, no lugar de uma frase solta no chão. */
export function SurfaceEmpty({ children }: { children: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-fg-muted">{children}</p>
  );
}

export default EmptyState;
