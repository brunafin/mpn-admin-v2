import { cardClassName } from '../Card';
import { listClassName } from '../ListRow';

type SkeletonBoneProps = {
  className?: string;
};

/** Barra interna do skeleton. */
export function SkeletonBone({ className = '' }: SkeletonBoneProps) {
  return (
    <span
      className={`block rounded-md bg-border ${className}`}
      aria-hidden
    />
  );
}

type ClientsListSkeletonProps = {
  count?: number;
  className?: string;
};

export function ClientsListSkeleton({
  count = 6,
  className = '',
}: ClientsListSkeletonProps) {
  return (
    <ul
      className={`${listClassName} ${className}`}
      aria-label="Carregando lista"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1 animate-pulse">
            <SkeletonBone className="h-4 w-1/3 max-w-[14rem]" />
          </div>
          <SkeletonBone className="hidden h-4 w-24 shrink-0 animate-pulse lg:block" />
          <SkeletonBone className="hidden h-4 w-16 shrink-0 animate-pulse lg:block" />
        </li>
      ))}
    </ul>
  );
}

export function SettingsFormSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`max-w-xl animate-pulse space-y-3 px-4 py-4 ${cardClassName} ${className}`}
      aria-label="Carregando"
      aria-busy="true"
    >
      <SkeletonBone className="h-4 w-2/3" />
      <SkeletonBone className="h-3.5 w-full" />
      <SkeletonBone className="h-3.5 w-4/5" />
      <SkeletonBone className="mt-4 h-10 w-28" />
    </div>
  );
}

export function ClientDetailSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse space-y-6 ${className}`}
      aria-label="Carregando informações"
      aria-busy="true"
    >
      <div>
        <SkeletonBone className="h-4 w-40" />
        <SkeletonBone className="mt-2 h-3.5 w-28" />
        <SkeletonBone className="mt-2 h-3.5 w-56" />
      </div>
      <div className={`${cardClassName} space-y-2 px-4 py-4`}>
        <SkeletonBone className="h-3 w-16" />
        <SkeletonBone className="h-4 w-24" />
        <SkeletonBone className="h-3.5 w-40" />
      </div>
      <div className={`${cardClassName} space-y-2 px-4 py-4`}>
        <SkeletonBone className="h-3 w-24" />
        <SkeletonBone className="h-4 w-full" />
        <SkeletonBone className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function PlansListSkeleton({
  count = 5,
  className = '',
  isolated = false,
}: {
  count?: number;
  className?: string;
  isolated?: boolean;
}) {
  const items = Array.from({ length: count }).map((_, index) => (
    <li
      key={index}
      className={`animate-pulse px-4 ${isolated ? `py-4 ${cardClassName}` : 'py-3'}`}
    >
      {isolated ? (
        <div className="flex items-center justify-between gap-3">
          <SkeletonBone className="h-4 w-2/3 max-w-[12rem]" />
          <SkeletonBone className="h-4 w-16 shrink-0" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBone className="h-4 w-2/3 max-w-[12rem]" />
              <SkeletonBone className="h-3.5 w-3/4 max-w-[14rem]" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <SkeletonBone className="h-3 w-20" />
              <SkeletonBone className="h-5 w-24" />
            </div>
            <div className="space-y-2">
              <SkeletonBone className="h-3 w-16" />
              <SkeletonBone className="h-5 w-20" />
            </div>
          </div>
        </>
      )}
    </li>
  ));

  if (isolated) {
    return (
      <ul
        className={`space-y-3 ${className}`}
        aria-label="Carregando planos"
        aria-busy="true"
      >
        {items}
      </ul>
    );
  }

  return (
    <ul
      className={`${listClassName} ${className}`}
      aria-label="Carregando planos"
      aria-busy="true"
    >
      {items}
    </ul>
  );
}

export function MonthCardsSkeleton({
  count = 3,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`space-y-3 ${className}`}
      aria-label="Carregando comissões"
      aria-busy="true"
    >
      <div className={`animate-pulse px-4 py-4 ${cardClassName}`}>
        <SkeletonBone className="h-3 w-28" />
        <SkeletonBone className="mt-3 h-7 w-24" />
      </div>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse px-4 py-4 ${cardClassName}`}
        >
          <div className="flex items-center justify-between gap-3">
            <SkeletonBone className="h-4 w-32" />
            <SkeletonBone className="h-4 w-16" />
          </div>
          <SkeletonBone className="mt-4 h-3.5 w-2/3" />
          <SkeletonBone className="mt-2 h-3.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}
