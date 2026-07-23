import { useEffect, useId, useRef } from 'react';
import { BsX } from 'react-icons/bs';
import { MdCheck } from 'react-icons/md';

export type SortSheetOption<T extends string> = {
  id: T;
  label: string;
  description?: string;
};

type SortSheetProps<T extends string> = {
  isOpen: boolean;
  title?: string;
  value: T;
  options: Array<SortSheetOption<T>>;
  onChange: (value: T) => void;
  onClose: () => void;
};

function SortSheet<T extends string>({
  isOpen,
  title = 'Ordenar por',
  value,
  options,
  onChange,
  onClose,
}: SortSheetProps<T>) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex w-full max-w-sm flex-col rounded-t-3xl bg-master-light text-text-light shadow-2xl sm:rounded-2xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />

        <div className="flex items-center justify-between gap-3 px-4 pb-0.5 pt-3 sm:pt-3.5">
          <h2
            id={titleId}
            className="text-sm font-medium text-text-light/55"
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-full text-text-light/55 hover:bg-master hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <BsX size={22} aria-hidden />
          </button>
        </div>

        <ul
          className="flex flex-col gap-0.5 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1"
          role="listbox"
          aria-labelledby={titleId}
        >
          {options.map((option) => {
            const selected = option.id === value;
            return (
              <li key={option.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.id);
                    onClose();
                  }}
                  className={`mpn-tap flex min-h-14 w-full items-center gap-3 rounded-xl px-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
                    selected
                      ? 'bg-master ring-1 ring-inset ring-accent-blue/40'
                      : 'hover:bg-master active:bg-master/80'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-text-light">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="mt-0.5 block text-sm text-text-light/55">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <MdCheck
                      size={22}
                      className="shrink-0 text-accent-blue"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default SortSheet;
