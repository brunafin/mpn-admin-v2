import type { ButtonHTMLAttributes, ReactNode } from "react";
import { surfaceShadowClass } from "../Card";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "dangerOutline"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 rounded-md px-3 text-sm",
  md: "h-10 rounded-md px-5 text-sm",
  lg: "h-14 rounded-md px-5 text-sm",
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-badge text-on-accent-badge hover:bg-accent-badge-active",
  secondary: `bg-surface text-fg hover:bg-arena-hover ${surfaceShadowClass}`,
  danger: "bg-danger text-white hover:bg-danger/90",
  dangerOutline: "bg-danger-soft text-danger-ink hover:brightness-95",
  ghost: "bg-transparent text-fg-muted hover:bg-arena-hover hover:text-fg",
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
    "inline-flex items-center justify-center gap-1.5 font-semibold transition",
    "enabled:active:brightness-95",
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
