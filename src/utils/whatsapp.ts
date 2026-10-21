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

function firstName(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-');
  if (!year || !month || !day) return dueDate;
  return `${day}/${month}/${year}`;
}

/** Texto pronto para lembrar a mensalidade vencida. `dueDate` é YYYY-MM-DD. */
export function paymentReminderMessage(input: {
  ownerName: string | null;
  arenaName: string;
  amountLabel: string;
  dueDate: string;
  overdueCount: number;
}): string {
  const name = firstName(input.ownerName);
  const hello = name ? `Olá, ${name}!` : 'Olá!';
  const due = formatDueDate(input.dueDate);
  if (input.overdueCount > 1) {
    return `${hello} Aqui é da Marca Pra Nós. A ${input.arenaName} está com ${input.overdueCount} mensalidades em atraso (${input.amountLabel}). A mais antiga venceu em ${due}. Consegue regularizar quando puder?`;
  }
  return `${hello} Aqui é da Marca Pra Nós. A mensalidade da ${input.arenaName} (${input.amountLabel}) venceu em ${due}. Consegue regularizar quando puder?`;
}
