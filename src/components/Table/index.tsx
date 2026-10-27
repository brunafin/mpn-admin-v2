import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { surfaceShadowClass } from '../Card';

type TableProps = {
  columns: string[];
  /** Grade do desktop, a mesma no cabeçalho e em cada linha. */
  gridClass: string;
  children: ReactNode;
  className?: string;
};

/** Tabela do admin. Uma superfície; as linhas não têm cartão próprio. */
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
        className={`hidden px-4 py-2 text-xs font-medium text-fg-muted lg:grid lg:items-center lg:gap-3 ${gridClass}`}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <ul>{children}</ul>
    </div>
  );
}

const rowGrid =
  'grid w-full grid-cols-1 gap-1 px-4 py-3 text-left transition hover:bg-arena-hover lg:items-center lg:gap-3';

export function TableRow({
  gridClass,
  children,
  to,
  onClick,
  label,
}: {
  gridClass: string;
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  label?: string;
}) {
  const className = `${rowGrid} ${gridClass}`;

  if (to) {
    return (
      <li>
        <Link to={to} className={className} aria-label={label}>
          {children}
        </Link>
      </li>
    );
  }

  if (onClick) {
    return (
      <li>
        <button type="button" onClick={onClick} className={className} aria-label={label}>
          {children}
        </button>
      </li>
    );
  }

  return (
    <li>
      <div className={className}>{children}</div>
    </li>
  );
}

/** Célula. No celular o rótulo aparece; no desktop ele fica só para o leitor de tela. */
export function TableCell({
  label,
  children,
  className = '',
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      {label ? (
        <p className="text-xs text-fg-muted lg:sr-only">{label}</p>
      ) : null}
      {children}
    </div>
  );
}
