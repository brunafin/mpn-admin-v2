import type { ClientSituation } from '../../utils/clientSituation';
import { SITUATION_LABEL } from '../../utils/clientSituation';
import type { PartnerStatus } from '../../api/clients';
import type { OutreachStatus } from '../../api/prospects';
import { OUTREACH_LABEL } from '../../api/prospects';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'ink';

export const badgeToneClass: Record<BadgeTone, string> = {
  neutral: 'bg-[#e6e8ec] text-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger-ink',
  accent: 'bg-accent-badge text-on-accent-badge',
  ink: 'bg-[#2c2c2c] text-[#f7f8fa]',
};

type BadgeProps = {
  children: string;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit max-w-full shrink-0 items-center rounded-md px-3 py-1.5 text-xs font-medium leading-normal ${badgeToneClass[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

const partnerStatus: Record<PartnerStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Ativo', tone: 'accent' },
  onboarding: { label: 'Onboarding', tone: 'neutral' },
  inactive: { label: 'Inativo', tone: 'neutral' },
  expired: { label: 'Expirado', tone: 'danger' },
};

export function PartnerStatusBadge({ status }: { status: PartnerStatus }) {
  const { label, tone } = partnerStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const situationTone: Record<ClientSituation, BadgeTone> = {
  active: 'accent',
  trial: 'ink',
  expired: 'danger',
  inactive: 'neutral',
  onboarding: 'neutral',
};

export function SituationBadge({ situation }: { situation: ClientSituation }) {
  return <Badge tone={situationTone[situation]}>{SITUATION_LABEL[situation]}</Badge>;
}

const outreachTone: Record<OutreachStatus, BadgeTone> = {
  new: 'neutral',
  contacted: 'warning',
  waiting: 'warning',
  interested: 'success',
  won: 'success',
  lost: 'danger',
  competitor: 'danger',
  skip: 'neutral',
};

export function OutreachBadge({ status }: { status: OutreachStatus }) {
  return <Badge tone={outreachTone[status]}>{OUTREACH_LABEL[status]}</Badge>;
}

export default Badge;
