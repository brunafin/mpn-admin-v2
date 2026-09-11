import type { ClientSituation } from '../../utils/clientSituation';
import { SITUATION_LABEL } from '../../utils/clientSituation';
import type { PartnerStatus } from '../../api/clients';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

const toneClass: Record<BadgeTone, string> = {
  neutral: 'border border-border bg-canvas text-fg-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

type BadgeProps = {
  children: string;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${toneClass[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

const partnerStatus: Record<PartnerStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Ativo', tone: 'success' },
  onboarding: { label: 'Onboarding', tone: 'neutral' },
  inactive: { label: 'Inativo', tone: 'neutral' },
  expired: { label: 'Expirado', tone: 'warning' },
};

export function PartnerStatusBadge({ status }: { status: PartnerStatus }) {
  const { label, tone } = partnerStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const situationTone: Record<ClientSituation, BadgeTone> = {
  active: 'success',
  trial: 'warning',
  expired: 'danger',
  inactive: 'neutral',
  onboarding: 'neutral',
};

export function SituationBadge({ situation }: { situation: ClientSituation }) {
  return <Badge tone={situationTone[situation]}>{SITUATION_LABEL[situation]}</Badge>;
}

export default Badge;
