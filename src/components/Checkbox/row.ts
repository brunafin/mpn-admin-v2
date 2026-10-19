import { surfaceShadowClass } from "../Card";

/** Cartão de escolha. O fundo marca a seleção, sem contorno. */
export function choiceRowClass(checked: boolean, className = "") {
  return `mpn-tap flex min-h-14 cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-fg transition-colors ${surfaceShadowClass} ${
    checked ? "bg-accent-soft" : "bg-surface hover:bg-arena-hover"
  } ${className}`;
}
