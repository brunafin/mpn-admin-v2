import type { ElementType, ReactNode } from 'react';

/** Sombra curta. Separa a superfície do chão no lugar da borda. */
export const surfaceShadowClass =
  'shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_rgb(0_0_0/0.05)]';

/** Superfície padrão. O branco e a sombra separam o cartão, sem contorno. */
export const cardClassName = `rounded-lg bg-surface ${surfaceShadowClass}`;

/** Métrica solta. Cada número é um cartão, separado por espaço. */
export const metricTileClass = `rounded-lg bg-surface px-4 py-3 ${surfaceShadowClass}`;

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
