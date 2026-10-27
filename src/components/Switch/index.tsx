import { useId } from "react";

type SwitchProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

/** Liga ou desliga na hora. Sem estado misto. Interação: Magoo 1.5.0, Switch. */
export default function Switch({
  name,
  label,
  checked,
  onChange,
  hint,
  disabled = false,
  className = "",
}: SwitchProps) {
  const uid = useId();
  const hintId = hint ? `${uid}-hint` : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={uid}
        className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-fg has-disabled:cursor-not-allowed"
      >
        <input
          id={uid}
          name={name}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-describedby={hintId}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 shrink-0 rounded-full bg-chip transition peer-checked:bg-accent-badge peer-checked:[&>span]:translate-x-5 peer-checked:[&>span]:bg-surface peer-disabled:opacity-50"
        >
          <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.16)] transition" />
        </span>
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
