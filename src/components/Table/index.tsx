import type { ReactNode } from 'react';
import { surfaceShadowClass } from '../Card';

type TableProps = {
  columns: string[];
  /** Grade do desktop, a mesma no cabeçalho e em cada linha. */
  gridClass: string;
  children: ReactNode;
  className?: string;
};

/** Tabela do admin. O cartão e a sombra separam; as linhas não têm contorno. */
export default function Table({
  columns,
  gridClass,
  children,
  className = '',
}: TableProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg bg-surface ${surfaceShadowClass} ${className}`.trim()}
    >
      <div
        className={`hidden px-4 py-2 text-xs font-medium text-fg-muted lg:grid lg:gap-3 ${gridClass}`}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <ul>{children}</ul>
    </div>
  );
}

export function TableRow({
  gridClass,
  children,
}: {
  gridClass: string;
  children: ReactNode;
}) {
  return (
    <li>
      <div
        className={`grid grid-cols-1 gap-1 px-4 py-3 hover:bg-arena-hover lg:items-center lg:gap-3 ${gridClass}`}
      >
        {children}
      </div>
    </li>
  );
}
