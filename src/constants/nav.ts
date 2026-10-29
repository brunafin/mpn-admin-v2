import {
  MdOutlineConstruction,
  MdOutlineDashboard,
  MdOutlineHandshake,
  MdOutlinePayments,
  MdOutlineTimer,
  MdOutlinePeopleAlt,
  MdOutlinePercent,
  MdOutlineReceiptLong,
  MdOutlineTravelExplore,
} from 'react-icons/md';

export const ADMIN_NAV = [
  {
    to: '/inicio',
    label: 'Início',
    description: 'Filas do dia',
    Icon: MdOutlineDashboard,
    match: (path: string) => path === '/inicio',
  },
  {
    to: '/clientes',
    label: 'Clientes',
    description: 'Arenas e donos',
    Icon: MdOutlinePeopleAlt,
    match: (path: string) =>
      path === '/clientes' || path.startsWith('/clientes/'),
  },
  {
    to: '/prospectos',
    label: 'Prospectos',
    description: 'Quadras no Google',
    Icon: MdOutlineTravelExplore,
    match: (path: string) =>
      path === '/prospectos' || path.startsWith('/prospectos/'),
  },
  {
    to: '/representantes',
    label: 'Representantes',
    description: 'Sellers e comissões',
    Icon: MdOutlineHandshake,
    match: (path: string) =>
      path === '/representantes' || path.startsWith('/representantes/'),
  },
  {
    to: '/planos',
    label: 'Planos',
    description: 'Mensalidades e catálogo',
    Icon: MdOutlinePayments,
    match: (path: string) => path === '/planos' || path.startsWith('/planos/'),
  },
  {
    to: '/inadimplencia',
    label: 'Inadimplência',
    description: 'Dias até o bloqueio',
    Icon: MdOutlineTimer,
    match: (path: string) => path === '/inadimplencia',
  },
  {
    to: '/custos',
    label: 'Custos',
    description: 'Gastos da plataforma',
    Icon: MdOutlineReceiptLong,
    match: (path: string) => path === '/custos' || path.startsWith('/custos/'),
  },
  {
    to: '/manutencao',
    label: 'Manutenção',
    description: 'Site público',
    Icon: MdOutlineConstruction,
    match: (path: string) => path === '/manutencao',
    separated: true,
  },
] as const;

/** Item ativo em pílula escura. O wash teal fica para filtro, não para “você está aqui”. */
export function navItemClass(active: boolean) {
  return active
    ? 'bg-fg font-semibold text-canvas'
    : 'text-fg-muted hover:bg-arena-hover hover:text-fg';
}

export const SELLER_NAV = [
  {
    to: '/inicio',
    label: 'Início',
    description: 'Suas quadras',
    Icon: MdOutlineDashboard,
    match: (path: string) =>
      path === '/inicio' || path.startsWith('/clientes/'),
  },
  {
    to: '/comissoes',
    label: 'Comissões',
    description: 'Acompanhamento',
    Icon: MdOutlinePercent,
    match: (path: string) => path === '/comissoes',
  },
] as const;
