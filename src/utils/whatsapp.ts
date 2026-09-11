export const WHATSAPP_BASE =
  import.meta.env.VITE_WHATSAPP_URL_BASE || 'https://wa.me/55';

export function whatsappUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `${WHATSAPP_BASE}${digits}`;
}
