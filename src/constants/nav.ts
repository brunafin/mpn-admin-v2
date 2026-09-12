import {
  MdOutlineDashboard,
  MdOutlineHandshake,
  MdOutlinePayments,
  MdOutlinePeopleAlt,
  MdOutlinePercent,
  MdOutlinePerson,
  MdOutlineReceiptLong,
  MdOutlineTravelExplore,
} from 'react-icons/md';

export const ADMIN_NAV = [
  {
    to: '/inicio',
    label: 'Início',
    description: 'Painel e acessos',
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
    to: '/custos',
    label: 'Custos',
    description: 'Gastos da plataforma',
    Icon: MdOutlineReceiptLong,
    match: (path: string) => path === '/custos' || path.startsWith('/custos/'),
  },
  {
    to: '/perfil',
    label: 'Perfil',
    description: 'Seus dados',
    Icon: MdOutlinePerson,
    match: (path: string) => path === '/perfil',
  },
] as const;

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
  {
    to: '/perfil',
    label: 'Perfil',
    description: 'Seus dados',
    Icon: MdOutlinePerson,
    match: (path: string) => path === '/perfil',
  },
] as const;
