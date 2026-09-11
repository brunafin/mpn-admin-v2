import type { ElementType, ReactNode } from 'react';

/** Superfície padrão — branco com borda. */
export const cardClassName = 'rounded-lg border border-border bg-surface';

export const cardPaddingClassName = 'px-4 py-4';

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  'aria-labelledby'?: string;
  'aria-label'?: string;
};

export function Card({
  children,
  className = '',
  as: Tag = 'section',
  ...rest
}: CardProps) {
  return (
    <Tag
      className={`${cardClassName} ${cardPaddingClassName} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardLabel({
  children,
  id,
  as: Tag = 'h2',
  className = '',
}: {
  children: ReactNode;
  id?: string;
  as?: 'h1' | 'h2' | 'p';
  className?: string;
}) {
  return (
    <Tag
      id={id}
      className={`text-xs font-medium uppercase tracking-wide text-fg-muted ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardMetric({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mt-1 font-semibold tabular-nums tracking-tight text-fg ${className}`}
    >
      {children}
    </p>
  );
}

export default Card;
