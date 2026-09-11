export type ClientSituation =
  | 'active'
  | 'trial'
  | 'expired'
  | 'inactive'
  | 'onboarding';

export const SITUATION_LABEL: Record<ClientSituation, string> = {
  active: 'Ativo',
  trial: 'Trial',
  expired: 'Expirado',
  inactive: 'Inativo',
  onboarding: 'Cadastro',
};

export function clientSituation(item: {
  kind?: 'company' | 'onboarding';
  partnerStatus: string | null;
  isTrial: boolean;
}): ClientSituation {
  if (item.kind === 'onboarding' || item.partnerStatus === 'onboarding') {
    return 'onboarding';
  }
  if (item.partnerStatus === 'expired') return 'expired';
  if (item.partnerStatus === 'inactive') return 'inactive';
  if (item.isTrial) return 'trial';
  return 'active';
}
