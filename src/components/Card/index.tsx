import type { ElementType, ReactNode } from 'react';

/** Superfície padrão do admin — card da home. */
export const cardClassName =
  'rounded-3xl bg-master-light shadow-[0_1px_3px_rgba(21,32,51,0.08),0_8px_24px_rgba(21,32,51,0.06)]';

export const cardPaddingClassName = 'px-5 py-5';

const cardShellClassName =
  'rounded-3xl shadow-[0_1px_3px_rgba(21,32,51,0.08),0_8px_24px_rgba(21,32,51,0.06)]';

const cardToneBgClass = {
  blue: 'bg-accent-blue/10',
  green: 'bg-accent-green/10',
  purple: 'bg-accent-purple/10',
  neutral: 'bg-text-light/6',
} as const;

type CardTone = keyof typeof cardToneBgClass;

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  tone?: CardTone;
  'aria-labelledby'?: string;
  'aria-label'?: string;
};

export function Card({
  children,
  className = '',
  as: Tag = 'section',
  tone,
  ...rest
}: CardProps) {
  const surface = tone ? cardToneBgClass[tone] : 'bg-master-light';
  return (
    <Tag
      className={`${cardShellClassName} ${surface} ${cardPaddingClassName} ${className}`.trim()}
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
    muted: 'text-text-light/70',
    blue: 'text-accent-blue',
    green: 'text-accent-green',
    purple: 'text-accent-purple-soft',
  }[tone];

  return (
    <Tag
      id={id}
      className={`text-sm font-semibold tracking-wide ${toneClass} ${className}`}
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
  tone?: 'blue' | 'green' | 'purple' | 'white';
}) {
  const toneClass = {
    blue: 'text-accent-blue',
    green: 'text-accent-green',
    purple: 'text-accent-purple-soft',
    white: 'text-white',
  }[tone];

  return (
    <p
      className={`mt-1 font-semibold tabular-nums tracking-tight ${toneClass} ${className}`}
    >
      {children}
    </p>
  );
}

/** Faixa colorida no topo do card — label + número em branco. */
export function CardHero({
  children,
  tone,
  className = '',
}: {
  children: ReactNode;
  tone: 'blue' | 'green' | 'purple' | 'neutral';
  className?: string;
}) {
  const toneClass = {
    blue: 'bg-accent-blue',
    green: 'bg-accent-green',
    purple: 'bg-accent-purple',
    neutral: 'bg-text-light',
  }[tone];

  return (
    <div
      className={`-mx-5 -mt-5 mb-4 rounded-t-3xl px-5 py-4 ${toneClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export default Card;
