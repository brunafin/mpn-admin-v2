import { useEffect, useId, useRef } from "react";
import CheckMark from "./Mark";
import { choiceRowClass } from "./row";

type CheckboxProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** Estado misto. O pai deve desligar ao receber a mudança. */
  indeterminate?: boolean;
  className?: string;
};

/** Escolha independente. Interação: Magoo 1.5.0, Checkbox. */
export default function Checkbox({
  name,
  label,
  checked,
  onChange,
  hint,
  error,
  disabled = false,
  required = false,
  indeterminate = false,
  className = "",
}: CheckboxProps) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = hint ? `${uid}-hint` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={className}>
      <label
        className={choiceRowClass(
          checked,
          disabled ? "w-full cursor-not-allowed opacity-60" : "w-full",
        )}
      >
        <input
          ref={inputRef}
          id={uid}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="peer sr-only"
        />
        <CheckMark checked={checked} indeterminate={indeterminate} />
        <span className="font-medium">{label}</span>
      </label>
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
