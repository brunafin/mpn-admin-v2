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

function firstName(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-');
  if (!year || !month || !day) return dueDate;
  return `${day}/${month}/${year}`;
}

function formatBrazilDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
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

/** Texto para quem está no teste e precisa ativar o plano. */
export function trialActivationMessage(input: {
  ownerName: string | null;
  arenaName: string;
  trialEndsAt: string;
}): string {
  const name = firstName(input.ownerName);
  const hello = name ? `Olá, ${name}!` : 'Olá!';
  const when = formatBrazilDate(input.trialEndsAt);
  return `${hello} Aqui é da Marca Pra Nós. O teste da ${input.arenaName} acaba em ${when}. Para a agenda continuar no ar, é só ativar o plano. Quer que eu te acompanhe nisso?`;
}

export type ProspectOutreachCase = {
  name: string;
  placeKind?: 'arena' | 'society' | 'condo' | 'school' | 'closed' | null;
  competitor?:
    | 'unknown'
    | 'none'
    | 'webquadras'
    | 'agendei'
    | 'own_site'
    | 'other'
    | null;
};

/**
 * Texto de abordagem conforme o caso. Cada tipo muda o miolo
 * para o WhatsApp não ver a mesma mensagem em todas as quadras.
 * Fechou não tem texto de venda.
 */
export function prospectOutreachMessage(
  input: string | ProspectOutreachCase,
): string | null {
  const prospect: ProspectOutreachCase =
    typeof input === 'string' ? { name: input } : input;
  const name = prospect.name.trim() || 'sua quadra';
  if (prospect.placeKind === 'closed') return null;

  const hasSystem =
    prospect.competitor === 'webquadras' ||
    prospect.competitor === 'agendei' ||
    prospect.competitor === 'own_site' ||
    prospect.competitor === 'other';
  if (hasSystem) {
    return `Olá! Aqui é da Marca Pra Nós. Vi a ${name} e notei que vocês já usam agenda online. Quem troca de sistema costuma sentir mensalidade e suporte. A gente deixa o cliente reservar e vocês recebem. Posso comparar em 2 minutos?`;
  }

  switch (prospect.placeKind) {
    case 'arena':
      return `Olá! Aqui é da Marca Pra Nós. Vi a ${name} no Google. Arena com mais de uma quadra perde horário no meio do WhatsApp. A agenda online deixa o cliente reservar sozinho. Posso te mostrar em 2 minutos?`;
    case 'society':
      return `Olá! Aqui é da Marca Pra Nós. Vi o ${name} no Google. Society que aluga hora vive de mensagem e de gente que não aparece. A agenda segura o horário e libera a quadra sozinha. Quer ver como fica?`;
    case 'condo':
      return `Olá! Aqui é da Marca Pra Nós. Vi o ${name}. Em condomínio o pedido costuma ser a reserva dos moradores, sem abrir a quadra para a cidade. O sistema faz isso. Posso te explicar em 2 minutos?`;
    case 'school':
      return `Olá! Aqui é da Marca Pra Nós. Vi a ${name}. Escola e escolinha precisam encaixar aula, aluno e quadra sem planilha. A agenda separa isso. Posso te mostrar rapidinho?`;
    default:
      return `Olá! Aqui é da Marca Pra Nós. Vi a ${name} no Google e trabalho com agenda online para quem aluga quadra por hora. Se fizer sentido, te mostro em 2 minutos.`;
  }
}
