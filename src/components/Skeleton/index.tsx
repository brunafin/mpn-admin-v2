import { cardClassName, cardPaddingClassName } from '../Card';

type SkeletonBoneProps = {
  className?: string;
};

/** Barra interna do skeleton (tom mais claro sobre o card). */
export function SkeletonBone({ className = '' }: SkeletonBoneProps) {
  return (
    <span
      className={`block rounded bg-text-light/10 ${className}`}
      aria-hidden
    />
  );
}

type ClientsListSkeletonProps = {
  count?: number;
  className?: string;
};

/** Skeleton da lista de clientes (cards mobile-first). */
export function ClientsListSkeleton({
  count = 6,
  className = '',
}: ClientsListSkeletonProps) {
  return (
    <ul
      className={`animate-pulse space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 ${className}`}
      aria-label="Carregando clientes"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className={`flex min-h-[4.5rem] items-center gap-3 ${cardClassName} px-5 py-4`}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBone className="h-5 w-2/3 max-w-[12rem]" />
              <SkeletonBone className="h-5 w-14 shrink-0 rounded-full" />
            </div>
            <SkeletonBone className="h-4 w-1/2 max-w-[10rem]" />
            <SkeletonBone className="h-3.5 w-3/4 max-w-[14rem]" />
          </div>
          <SkeletonBone className="size-6 shrink-0 rounded-md" />
        </li>
      ))}
    </ul>
  );
}

/** Skeleton do detalhe do cliente — espelha a hierarquia da página. */
export function ClientDetailSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse space-y-4 ${className}`}
      aria-label="Carregando informações"
      aria-busy="true"
    >
      <div className={`${cardClassName} ${cardPaddingClassName}`}>
        <div className="flex items-center justify-between gap-3">
          <SkeletonBone className="h-4 w-36" />
          <SkeletonBone className="h-3 w-28" />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className={`${cardClassName} ${cardPaddingClassName}`}>
            <div className="flex items-center justify-between gap-3">
              <SkeletonBone className="h-3 w-12" />
              <SkeletonBone className="h-4 w-14" />
            </div>
            <SkeletonBone className="mt-3 h-7 w-28" />
            <SkeletonBone className="mt-2 h-4 w-32" />
          </div>
          <div className={`${cardClassName} ${cardPaddingClassName}`}>
            <div className="flex items-center justify-between gap-3">
              <SkeletonBone className="h-3 w-20" />
              <SkeletonBone className="h-4 w-16" />
            </div>
            <SkeletonBone className="mt-3 h-4 w-24" />
            <SkeletonBone className="mt-3 h-8 w-full" />
            <SkeletonBone className="mt-2 h-8 w-full" />
          </div>
        </div>
        <div className={`${cardClassName} ${cardPaddingClassName}`}>
          <div className="flex items-center justify-between gap-3">
            <SkeletonBone className="h-3 w-16" />
            <SkeletonBone className="h-3 w-6" />
          </div>
          <SkeletonBone className="mt-3 h-8 w-full" />
          <SkeletonBone className="mt-2 h-8 w-full" />
          <SkeletonBone className="mt-2 h-8 w-full" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton da lista de planos. */
export function PlansListSkeleton({
  count = 5,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <ul
      className={`animate-pulse space-y-3 ${className}`}
      aria-label="Carregando planos"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className={`${cardClassName} ${cardPaddingClassName}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBone className="h-5 w-2/3 max-w-[12rem]" />
              <SkeletonBone className="h-4 w-3/4 max-w-[14rem]" />
            </div>
            <SkeletonBone className="size-6 shrink-0 rounded-md" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-text-light/10 pt-3.5">
            <div className="space-y-2">
              <SkeletonBone className="h-3 w-20" />
              <SkeletonBone className="h-6 w-24" />
            </div>
            <div className="space-y-2">
              <SkeletonBone className="h-3 w-16" />
              <SkeletonBone className="h-6 w-20" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
