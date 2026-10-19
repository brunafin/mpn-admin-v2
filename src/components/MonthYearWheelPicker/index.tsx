import { useLayoutEffect, useMemo, useRef } from 'react';
import { surfaceShadowClass } from '../Card';

const ITEM_HEIGHT = 44;
const PAD_ROWS = 2;
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
  const syncingRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const fromScrollRef = useRef(false);

  useLayoutEffect(() => {
    if (fromScrollRef.current) {
      fromScrollRef.current = false;
      return;
    }
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const index = Math.max(0, options.indexOf(value));
    const target = index * ITEM_HEIGHT;
    if (Math.abs(scroller.scrollTop - target) <= 1) return;
    syncingRef.current = true;
    scroller.scrollTop = target;
    const release = window.setTimeout(() => {
      syncingRef.current = false;
    }, 48);
    return () => window.clearTimeout(release);
  }, [options, value]);

  useLayoutEffect(() => {
    return () => {
      if (settleTimerRef.current != null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const commitScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || syncingRef.current) return;
    const index = Math.min(
      options.length - 1,
      Math.max(0, Math.round(scroller.scrollTop / ITEM_HEIGHT)),
    );
    const next = options[index];
    const target = index * ITEM_HEIGHT;
    if (Math.abs(scroller.scrollTop - target) > 1) {
      syncingRef.current = true;
      scroller.scrollTo({ top: target, behavior: 'smooth' });
      window.setTimeout(() => {
        syncingRef.current = false;
      }, 320);
    }
    if (next !== undefined && next !== value) {
      fromScrollRef.current = true;
      onChange(next);
    }
  };

  const scheduleCommit = () => {
    if (syncingRef.current) return;
    if (settleTimerRef.current != null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(commitScroll, 140);
  };

  return (
    <div
      className="relative min-w-0 flex-1"
      role="listbox"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollerRef}
        onScroll={scheduleCommit}
        onScrollEnd={commitScroll}
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain touch-pan-y [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div aria-hidden style={{ height: ITEM_HEIGHT * PAD_ROWS }} />
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={String(option)}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(option)}
              className={`flex w-full snap-center items-center justify-center whitespace-nowrap text-base leading-none ${
                selected
                  ? 'font-semibold text-fg'
                  : 'font-medium text-fg-muted'
              }`}
              style={{ height: ITEM_HEIGHT }}
            >
              {formatLabel ? formatLabel(option) : String(option)}
            </button>
          );
        })}
        <div aria-hidden style={{ height: ITEM_HEIGHT * PAD_ROWS }} />
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
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = minYear; y <= maxYear; y += 1) list.push(y);
    return list;
  }, [minYear, maxYear]);
  const months = useMemo(
    () => MONTH_LABELS.map((_, index) => index + 1),
    [],
  );

  return (
    <div className="mb-3">
      <p className="mb-1.5 text-sm font-medium text-fg">Competência</p>
      <div
        className={`relative overflow-hidden rounded-md bg-surface ${surfaceShadowClass}`}
        style={{ height: PICKER_HEIGHT }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-1/2 z-0 -translate-y-1/2 rounded-md bg-canvas"
          style={{ height: ITEM_HEIGHT }}
        />
        <div className="relative z-10 flex h-full">
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-surface to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-surface to-transparent"
        />
      </div>
    </div>
  );
}
