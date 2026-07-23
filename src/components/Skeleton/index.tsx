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
      className={`animate-pulse space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 ${className}`}
      aria-label="Carregando clientes"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-master-light/70 px-4 py-3.5"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBone className="h-5 w-2/3 max-w-[12rem]" />
              <SkeletonBone className="h-5 w-14 rounded-full" />
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
      className={`animate-pulse space-y-3 ${className}`}
      aria-label="Carregando informações"
      aria-busy="true"
    >
      <div className="rounded-2xl bg-master-light/70 px-4 py-4">
        <div className="flex gap-2">
          <SkeletonBone className="h-6 w-20 rounded-full" />
          <SkeletonBone className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonBone className="mt-3 h-4 w-3/4 max-w-xs" />
      </div>

      <div className="rounded-2xl bg-master-light/70 px-4 py-4">
        <SkeletonBone className="h-3 w-20" />
        <SkeletonBone className="mt-3 h-6 w-40" />
        <SkeletonBone className="mt-2 h-4 w-52" />
        <SkeletonBone className="mt-4 h-12 w-full rounded-xl" />
        <SkeletonBone className="mt-2 h-12 w-full rounded-xl" />
      </div>

      <div className="rounded-2xl bg-master-light/70 px-4 py-4">
        <SkeletonBone className="h-3 w-24" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <SkeletonBone className="h-12 w-full rounded-lg" />
          <SkeletonBone className="h-12 w-full rounded-lg" />
          <SkeletonBone className="h-12 w-full rounded-lg" />
          <SkeletonBone className="h-12 w-full rounded-lg" />
        </div>
      </div>

      <div className="rounded-2xl bg-master-light/70 px-4 py-4">
        <SkeletonBone className="h-3 w-20" />
        <SkeletonBone className="mt-3 h-10 w-full rounded-lg" />
        <SkeletonBone className="mt-2 h-10 w-full rounded-lg" />
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
      className={`animate-pulse space-y-2 ${className}`}
      aria-label="Carregando planos"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-master-light/70 px-4 py-3.5"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBone className="h-5 w-2/3 max-w-[12rem]" />
              <SkeletonBone className="h-5 w-16" />
            </div>
            <SkeletonBone className="h-4 w-3/4 max-w-[14rem]" />
          </div>
          <SkeletonBone className="size-6 shrink-0 rounded-md" />
        </li>
      ))}
    </ul>
  );
}
