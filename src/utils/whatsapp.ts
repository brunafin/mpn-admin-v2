export const WHATSAPP_BASE =
  import.meta.env.VITE_WHATSAPP_URL_BASE || 'https://wa.me/55';

export function whatsappUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `${WHATSAPP_BASE}${digits}`;
}

export function whatsappUrlWithText(
  phone: string | null | undefined,
  text: string,
): string | null {
  const url = whatsappUrl(phone);
  if (!url) return null;
  return `${url}?text=${encodeURIComponent(text)}`;
}

export function prospectOutreachMessage(name: string): string {
  return `Olá, tudo bem? Aqui é da Marca Pra Nós. Vi a ${name} no Google e temos um sistema de agenda online para quadras. Posso te mostrar em 2 minutos?`;
}
