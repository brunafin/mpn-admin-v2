export function onlyCpfDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function formatCpfMask(value: string): string {
  const digits = onlyCpfDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function onlyCepDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

export function formatCepMask(value: string): string {
  const digits = onlyCepDigits(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
