import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "dangerOutline"
  | "ghost";

export type ButtonSize = "sm" | "md";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 rounded-md px-3 text-sm",
  md: "h-10 rounded-md px-3.5 text-sm",
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-fg/90 focus-visible:outline-fg",
  secondary:
    "border border-border bg-surface text-fg hover:bg-canvas focus-visible:outline-fg",
  danger:
    "bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger",
  dangerOutline:
    "border border-danger/30 bg-transparent text-danger hover:bg-danger-soft focus-visible:outline-danger",
  ghost:
    "bg-transparent text-fg-muted hover:bg-canvas hover:text-fg focus-visible:outline-fg",
};

/**
 * Classes compartilhadas para <button> e <Link>/<a>.
 * Preferir o componente Button quando for um button nativo.
 */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonClassOptions = {}): string {
  return [
    "inline-flex items-center justify-center gap-1.5 font-medium transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    sizeClass[size],
    variantClass[variant],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
