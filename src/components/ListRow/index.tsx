import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineChevronRight } from 'react-icons/md';

type ListRowProps = {
  to?: string;
  onClick?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  showChevron?: boolean;
  className?: string;
  'aria-label'?: string;
};

const rowClass =
  'mpn-tap flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg';

export default function ListRow({
  to,
  onClick,
  title,
  subtitle,
  meta,
  badge,
  children,
  showChevron,
  className = '',
  'aria-label': ariaLabel,
}: ListRowProps) {
  const chevron = showChevron ?? Boolean(to || onClick);

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-fg">{title}</p>
          {badge}
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-fg-muted">{subtitle}</p>
        ) : null}
        {meta ? (
          <p className="mt-1 text-xs text-fg-muted">{meta}</p>
        ) : null}
        {children}
      </div>
      {chevron ? (
        <MdOutlineChevronRight
          size={18}
          className="shrink-0 text-fg-muted"
          aria-hidden
        />
      ) : null}
    </>
  );

  const cls = `${rowClass} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={cls} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }

  return <div className={cls}>{content}</div>;
}
