import { MdCheck, MdRemove } from "react-icons/md";

type CheckMarkProps = {
  checked: boolean;
  indeterminate?: boolean;
};

/** Caixa do checkbox. O input nativo vem antes, com as classes `peer sr-only`. */
export default function CheckMark({ checked, indeterminate = false }: CheckMarkProps) {
  const on = checked || indeterminate;

  return (
    <span
      aria-hidden
      className={`flex size-5 shrink-0 items-center justify-center rounded-md transition-colors peer-disabled:opacity-50 ${
        on ? "bg-accent-badge text-on-accent-badge" : "bg-chip"
      }`}
    >
      {indeterminate ? <MdRemove size={16} /> : checked ? <MdCheck size={16} /> : null}
    </span>
  );
}
