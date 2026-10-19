import { useId, type ReactNode } from 'react';

type SectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
};

/** Região com um título. O nível do título é h2, abaixo do h1 da página. */
export default function Section({
  id,
  title,
  children,
  className = '',
}: SectionProps) {
  const headingId = useId();

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={className}
    >
      <h2 id={headingId} className="text-sm font-semibold text-fg">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
