import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  if (!isValid(date)) return '—';
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  if (!isValid(date)) return '—';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

/** Competência: "janeiro de 2026" */
export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : `${value}T12:00:00`;
  const date = parseISO(normalized);
  if (!isValid(date)) return '—';
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}
