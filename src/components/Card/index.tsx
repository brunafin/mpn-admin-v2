import type { ElementType, ReactNode } from 'react';

/** Superfície padrão do admin — card da home. */
export const cardClassName =
  'rounded-3xl bg-master-light shadow-[0_1px_3px_rgba(21,32,51,0.08),0_8px_24px_rgba(21,32,51,0.06)]';

export const cardPaddingClassName = 'px-5 py-5';

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
  tone = 'muted',
}: {
  children: ReactNode;
  id?: string;
  as?: 'h1' | 'h2' | 'p';
  className?: string;
  tone?: 'muted' | 'blue' | 'green' | 'purple';
}) {
  const toneClass = {
    muted: 'text-text-light/55',
    blue: 'text-accent-blue',
    green: 'text-accent-green',
    purple: 'text-accent-purple-soft',
  }[tone];

  return (
    <Tag
      id={id}
      className={`text-sm font-semibold uppercase tracking-wider ${toneClass} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardMetric({
  children,
  className = '',
  tone = 'blue',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'blue' | 'green' | 'purple';
}) {
  const toneClass = {
    blue: 'text-accent-blue',
    green: 'text-accent-green',
    purple: 'text-accent-purple-soft',
  }[tone];

  return (
    <p
      className={`mt-1 font-semibold tabular-nums tracking-tight ${toneClass} ${className}`}
    >
      {children}
    </p>
  );
}

export default Card;
