import { MdClose } from 'react-icons/md';

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

/** Filtro ativo, visível na página. Clicar tira esse filtro. */
export default function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remover filtro ${label}`}
      className="inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-chip px-2.5 text-xs font-medium text-fg transition hover:bg-fg/10"
    >
      <span className="truncate">{label}</span>
      <MdClose size={14} aria-hidden />
    </button>
  );
}
