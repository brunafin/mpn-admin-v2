import { useId } from "react";

export type RadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type RadioGroupProps = {
  name: string;
  legend: string;
  value: string;
  options: RadioOption[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Uma opção no grupo. Interação: Magoo 1.5.0, Radio Button. */
export default function RadioGroup({
  name,
  legend,
  value,
  options,
  onChange,
  hint,
  error,
  required = false,
  disabled = false,
  className = "",
}: RadioGroupProps) {
  const uid = useId();
  const hintId = hint ? `${uid}-hint` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset className={`min-w-0 border-0 p-0 ${className}`} disabled={disabled}>
      <legend className="mb-1.5 text-sm font-medium text-fg">
        {legend}
        {required && (
          <span className="font-medium text-danger-ink" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </legend>
      {hint && (
        <p id={hintId} className="mb-1.5 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      <div className="flex flex-col">
        {options.map((option) => {
          const id = `${uid}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-fg has-disabled:cursor-not-allowed"
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                disabled={option.disabled}
                required={required}
                aria-describedby={describedBy}
                className="size-5 shrink-0 accent-fg disabled:cursor-not-allowed"
              />
              <span className="font-medium">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-danger-ink">
          {error}
        </p>
      )}
    </fieldset>
  );
}
