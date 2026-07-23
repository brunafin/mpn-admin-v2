import { useEffect, useRef } from 'react';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

type MonthYearWheelPickerProps = {
  month: number;
  year: number;
  onChange: (next: { month: number; year: number }) => void;
  minYear?: number;
  maxYear?: number;
};

function WheelColumn<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  formatLabel,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  formatLabel?: (value: T) => string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const index = Math.max(0, options.indexOf(value));
    isSyncingRef.current = true;
    scroller.scrollTop = index * ITEM_HEIGHT;
    window.requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, [options, value]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current != null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const snapToNearest = () => {
    const scroller = scrollerRef.current;
    if (!scroller || isSyncingRef.current) return;

    const index = Math.min(
      options.length - 1,
      Math.max(0, Math.round(scroller.scrollTop / ITEM_HEIGHT)),
    );
    const next = options[index];
    const targetTop = index * ITEM_HEIGHT;

    if (Math.abs(scroller.scrollTop - targetTop) > 1) {
      scroller.scrollTo({ top: targetTop, behavior: 'smooth' });
    }

    if (next !== undefined && next !== value) {
      onChange(next);
    }
  };

  const handleScroll = () => {
    if (settleTimerRef.current != null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(snapToNearest, 80);
  };

  return (
    <div
      className="relative min-w-0 flex-1"
      role="listbox"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="h-[220px] snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
        }}
      >
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={String(option)}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onChange(option);
                const index = options.indexOf(option);
                scrollerRef.current?.scrollTo({
                  top: index * ITEM_HEIGHT,
                  behavior: 'smooth',
                });
              }}
              className={`flex w-full snap-center items-center justify-center text-lg transition-colors ${
                selected
                  ? 'font-semibold text-text-light'
                  : 'font-medium text-text-light/35'
              }`}
              style={{ height: ITEM_HEIGHT }}
            >
              {formatLabel ? formatLabel(option) : String(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MonthYearWheelPicker({
  month,
  year,
  onChange,
  minYear = 2020,
  maxYear = 2035,
}: MonthYearWheelPickerProps) {
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y += 1) years.push(y);
  const months = MONTH_LABELS.map((_, index) => index + 1);

  return (
    <div className="mb-3">
      <p className="mb-2 text-base font-semibold leading-6 text-text-light">
        Competência
      </p>
      <div
        className="relative overflow-hidden rounded-2xl bg-master"
        style={{ height: PICKER_HEIGHT }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-1/2 z-10 h-11 -translate-y-1/2 rounded-xl bg-text-light/10 ring-1 ring-inset ring-text-light/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-master to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-master to-transparent"
        />

        <div className="relative z-0 flex h-full">
          <WheelColumn
            ariaLabel="Mês"
            options={months}
            value={month}
            formatLabel={(value) => MONTH_LABELS[value - 1]}
            onChange={(nextMonth) => onChange({ month: nextMonth, year })}
          />
          <WheelColumn
            ariaLabel="Ano"
            options={years}
            value={year}
            onChange={(nextYear) => onChange({ month, year: nextYear })}
          />
        </div>
      </div>
    </div>
  );
}
