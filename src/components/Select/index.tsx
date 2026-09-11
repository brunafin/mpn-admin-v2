import { MdKeyboardArrowDown } from "react-icons/md";

interface ISelectOption {
  id: number | string;
  name: string;
}

interface ISelectProps {
  name: string;
  title?: string;
  value?: number | string;
  options: ISelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

function Select({
  name,
  title,
  value,
  options,
  onChange,
  onBlur,
  onFocus,
  required,
  className,
  disabled = false,
  placeholder = "Selecione...",
}: ISelectProps) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className={`mb-3 flex flex-col ${className ?? ""}`}>
      {title && (
        <label htmlFor={name} className="mb-1.5 text-sm font-medium text-fg">
          {title}
          {required && (
            <span className="font-medium text-fg-muted" aria-hidden="true">
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
          className={`h-10 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-10 text-sm text-fg
            focus:outline-none focus-visible:ring-1 focus-visible:ring-fg
            disabled:cursor-not-allowed disabled:opacity-60
            ${!hasValue ? "text-fg-muted" : ""}
          `}
        >
          <option value="" disabled={required}>
            {placeholder}
          </option>
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
    </div>
  );
}

export default Select;
