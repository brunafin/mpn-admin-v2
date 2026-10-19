import { useId, useRef, useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

interface IInputProps {
  type?: string;
  placeholder?: string;
  title?: string;
  /** Instrução visível antes de preencher. Associada ao campo. */
  hint?: string;
  value?: string;
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "tel"
    | "search"
    | "email"
    | "url";
  autoComplete?: string;
  autoCapitalize?: string;
  enterKeyHint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
  describedBy?: string;
  error?: string;
}

const sideButtonClass =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-transparent px-3 text-sm font-semibold text-fg hover:bg-arena-hover enabled:active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

/** Campo sem borda. O fundo e a sombra separam; o foco é só o contorno. */
export const fieldOutlineBase =
  "mpn-field rounded-md border-0 bg-surface px-3 text-sm font-normal text-fg placeholder:text-fg-muted shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_rgb(0_0_0/0.05)] outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const fieldOutlineClass = `${fieldOutlineBase} h-10`;

/**
 * Campo de uma linha. Interação: Magoo 1.5.0,
 * Input text, email, search e password.
 */
function Input({
  type = "text",
  name,
  title,
  hint,
  placeholder,
  value,
  onBlur,
  onChange,
  onClick,
  required,
  readOnly = false,
  disabled = false,
  inputMode,
  className,
  autoComplete,
  autoCapitalize,
  enterKeyHint,
  describedBy,
  error,
}: IInputProps) {
  const hintUid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isPassword = type === "password";
  const isSearch = type === "search";
  const maskClarity =
    isPassword ||
    type === "email" ||
    type === "tel" ||
    /password|email|phone|telefone|cpf|senha|contato|^name$/i.test(name);
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? hintUid : undefined;
  const describedByIds =
    [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;
  const inputType = isPassword && showPassword ? "text" : type;
  const hasSearchValue = isSearch && Boolean(value);

  const fieldClass = `${fieldOutlineClass} [&::-webkit-search-cancel-button]:appearance-none ${
    hasSearchValue ? "min-w-0 flex-1" : "w-full"
  }${isPassword ? " pr-12" : ""}`;

  function clearSearch() {
    onChange?.({
      target: { name, value: "" },
      currentTarget: { name, value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
    inputRef.current?.focus();
  }

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
      <div
        className={
          hasSearchValue
            ? "flex flex-wrap items-center gap-2"
            : isPassword
              ? "relative"
              : undefined
        }
      >
        <input
          ref={inputRef}
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          type={inputType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          enterKeyHint={enterKeyHint}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          className={`${fieldClass}${maskClarity ? " clarity-mask" : ""}`}
          data-clarity-mask={maskClarity ? "true" : undefined}
          onChange={onChange}
          onBlur={onBlur}
          onClick={onClick}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            disabled={disabled}
            className="absolute right-0 top-0 flex h-10 w-11 items-center justify-center rounded-md text-fg-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex size-full items-center justify-center">
              {showPassword ? (
                <MdVisibilityOff size={22} aria-hidden className="block" />
              ) : (
                <MdVisibility size={22} aria-hidden className="block" />
              )}
            </span>
          </button>
        )}
        {hasSearchValue && (
          <button
            type="button"
            onClick={clearSearch}
            disabled={disabled}
            className={sideButtonClass}
          >
            Limpar busca
          </button>
        )}
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

export default Input;
