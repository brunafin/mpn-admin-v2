import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BRAZIL_TZ = 'America/Sao_Paulo';

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : new Date(value);
}

/** dd/MM/yyyy HH:mm em America/Sao_Paulo (não depende do fuso do browser). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = toDate(value);
  if (!isValid(date)) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', '');
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = toDate(value);
  if (!isValid(date)) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
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
