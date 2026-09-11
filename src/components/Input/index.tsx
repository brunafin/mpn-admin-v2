import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

interface IInputProps {
  type?: string;
  placeholder?: string;
  title?: string;
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

function Input({
  type = "text",
  name,
  title,
  placeholder,
  value,
  onBlur,
  onChange,
  onClick,
  required,
  readOnly = false,
  inputMode,
  className,
  autoComplete,
  autoCapitalize,
  enterKeyHint,
  describedBy,
  error,
}: IInputProps) {
  const isPassword = type === "password";
  const maskClarity =
    isPassword ||
    type === "email" ||
    type === "tel" ||
    /password|email|phone|telefone|cpf|senha|contato|^name$/i.test(name);
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${name}-error` : undefined;
  const describedByIds =
    [describedBy, errorId].filter(Boolean).join(" ") || undefined;
  const inputType = isPassword && showPassword ? "text" : type;

  const fieldClass = `mpn-field h-10 w-full rounded-md border bg-surface px-3 text-sm font-normal text-fg
    placeholder:text-fg-muted
    focus:outline-none focus-visible:ring-1 focus-visible:ring-fg
    disabled:cursor-not-allowed disabled:opacity-60
    ${isPassword ? "pr-11" : ""}
    ${error ? "border-danger" : "border-border"}`;

  return (
    <div className={`mb-3 flex flex-col ${className ?? ""}`}>
      {title && (
        <label
          htmlFor={name}
          className="mb-1.5 text-sm font-medium text-fg"
        >
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
        <input
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
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className="absolute right-0.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted transition hover:bg-canvas hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {showPassword ? (
              <MdVisibilityOff size={18} aria-hidden />
            ) : (
              <MdVisibility size={18} aria-hidden />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
