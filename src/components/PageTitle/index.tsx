import type { ReactNode } from "react";

/** Título de página autenticada, com ação opcional à direita. */
export function PageHeader({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 px-4 pt-4 lg:px-8 lg:pt-6 ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-fg">
          {title}
        </h1>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

/** @deprecated Preferir PageHeader. */
export function PageEyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`min-w-0 truncate text-lg font-semibold tracking-tight text-fg ${className}`}
    >
      {children}
    </h2>
  );
}

/** Título principal em subpáginas com barra de voltar. */
export function PageTitle({
  children,
  align = "left",
  className = "",
  as: Tag = "h1",
}: {
  children: ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={`min-w-0 truncate text-lg font-semibold tracking-tight text-fg ${
        align === "center" ? "text-center" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
