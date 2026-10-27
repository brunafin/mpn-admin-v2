import { useId } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { fieldOutlineClass } from "../Input";

interface ISelectOption {
  id: number | string;
  name: string;
}

interface ISelectProps {
  name: string;
  title?: string;
  hint?: string;
  value?: number | string;
  options: ISelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Sem a opção vazia. A lista já traz o valor inicial, inclusive “todos”. */
  omitPlaceholder?: boolean;
  error?: string;
}

/** Seletor nativo. Interação: Magoo 1.5.0, Select (Combo). */
function Select({
  name,
  title,
  hint,
  value,
  options,
  onChange,
  onBlur,
  onFocus,
  required,
  className,
  disabled = false,
  placeholder = "Selecione...",
  omitPlaceholder = false,
  error,
}: ISelectProps) {
  const hintUid = useId();
  const hasValue = value !== undefined && value !== null && value !== "";
  const hintId = hint ? hintUid : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`mb-3 flex flex-col ${className ?? ""}`}>
      {title && (
        <label htmlFor={name} className="mb-1.5 text-sm font-medium text-fg">
          {title}
          {required && (
            <span className="font-medium text-danger-ink" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={hasValue ? String(value) : ""}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          required={required}
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${fieldOutlineClass} w-full appearance-none pr-10 ${
            !omitPlaceholder && !hasValue ? "text-fg-muted" : ""
          }`}
        >
          {omitPlaceholder ? null : (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={String(opt.id)} value={String(opt.id)}>
              {opt.name}
            </option>
          ))}
        </select>

        <MdKeyboardArrowDown
          size={20}
          aria-hidden
          className={`pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-muted ${
            disabled ? "opacity-50" : ""
          }`}
        />
      </div>
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

export default Select;
