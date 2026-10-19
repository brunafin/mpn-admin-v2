import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { MdOutlineCelebration } from 'react-icons/md';
import Alert from '../../components/Alert';
import AppLayout, { PAGE_SHELL } from '../../components/AppLayout';
import { SituationBadge } from '../../components/Badge';
import Button from '../../components/Button';
import Card, { CardLabel, CardMetric } from '../../components/Card';
import Checkbox from '../../components/Checkbox';
import Input from '../../components/Input';
import ListRow from '../../components/ListRow';
import { PageHeader } from '../../components/PageTitle';
import RadioGroup from '../../components/RadioGroup';
import Section from '../../components/Section';
import Select from '../../components/Select';
import Switch from '../../components/Switch';
import Table, { TableRow } from '../../components/Table';
import CheckboxGroup from '../../design-system/manager/components/CheckboxGroup';
import OptionChip from '../../design-system/manager/components/OptionChip';
import OptionToggle from '../../design-system/manager/components/OptionToggle';
import ReminderBadge from '../../design-system/manager/components/ReminderBadge';
import VoleyNetIcon from '../../design-system/manager/components/Icons/VoleyNetIcon';
import CalendarButton from '../../design-system/manager/reservation/CalendarButton';
import DateStrip from '../../design-system/manager/reservation/DateStrip';
import LegendAndFilters from '../../design-system/manager/reservation/Legend';
import ReservationItem from '../../design-system/manager/reservation/ReservationItem';
import ConfirmSheet from '../../design-system/manager/components/ConfirmSheet';
import { StatusIcons } from '../../design-system/manager/reservation/statusIcons';
import { ReservationStatusEnum } from '../../design-system/manager/reservation/enum';
import './design-system.css';

const liftShadow =
  'shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_rgb(0_0_0/0.05)]';

const sampleTableGrid =
  'lg:grid-cols-[minmax(0,1.4fr)_8rem_minmax(0,1.6fr)_5.5rem_7.5rem]';

const NAV = [
  ['cores', 'Cores'],
  ['campo', 'Campo'],
  ['select', 'Select'],
  ['checkbox', 'Checkbox'],
  ['radio', 'Radio'],
  ['botao', 'Botão'],
  ['alerta', 'Alerta'],
  ['card', 'Card'],
  ['lista', 'Lista'],
  ['badge', 'Badge'],
  ['tabela', 'Tabela'],
  ['agenda', 'Agenda'],
] as const;

type PaletteTone = {
  name: string;
  light: string;
  dark?: string;
};

/** Os mesmos hex de index.css e do tema escuro em design-system.css. */
const PALETTE: { name: string; role: string; tones: PaletteTone[] }[] = [
  {
    name: 'Cinza',
    role: 'Tema',
    tones: [
      { name: 'Claro', light: '#f7f8fa' },
      { name: 'Escuro', light: '#081425' },
    ],
  },
  {
    name: 'Azul',
    role: 'Reservado',
    tones: [
      { name: 'Suave', light: '#e6eef8', dark: '#152843' },
      { name: 'Barra', light: '#3b82f6', dark: '#2f6bcd' },
      { name: 'Base', light: '#1e4d96', dark: '#6b9ad4' },
    ],
  },
  {
    name: 'Azul-esverdeado',
    role: 'Marca',
    tones: [
      { name: 'Suave', light: '#e8f4f7', dark: '#1a3d48' },
      { name: 'Base', light: '#8ec4d2', dark: '#73a8bc' },
      { name: 'Ativo', light: '#73a8bc', dark: '#5d9dad' },
      { name: 'Badge', light: '#226e81', dark: '#3db4cc' },
    ],
  },
  {
    name: 'Verde',
    role: 'Livre',
    tones: [
      { name: 'Suave', light: '#e7f5ef', dark: '#17363f' },
      { name: 'Barra', light: '#059669', dark: '#36b083' },
      { name: 'Base', light: '#106b48', dark: '#36b083' },
    ],
  },
  {
    name: 'Roxo',
    role: 'Fixo',
    tones: [
      { name: 'Suave', light: '#e7e3f3', dark: '#202645' },
      { name: 'Barra', light: '#8b5cf6', dark: '#835cb9' },
      { name: 'Base', light: '#5b3d96', dark: '#a78bdb' },
    ],
  },
  {
    name: 'Aviso',
    role: 'Suporte',
    tones: [
      { name: 'Suave', light: '#fde8d8', dark: '#3a220f' },
      { name: 'Base', light: '#b13609', dark: '#fb923c' },
    ],
  },
  {
    name: 'Perigo',
    role: 'Suporte',
    tones: [
      { name: 'Suave', light: '#f8e9e8', dark: '#3a1d1b' },
      { name: 'Barra', light: '#ef4444', dark: '#f87171' },
      { name: 'Base', light: '#b42318' },
      { name: 'Texto', light: '#b42318', dark: '#f87171' },
    ],
  },
];

function swatchLuminance(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

function relativeLuminance(hex: string) {
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(ink: string, background: string) {
  const lighter = Math.max(relativeLuminance(ink), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(ink), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

/** Preto ou branco, o que tiver mais contraste. O brilho simplificado punha branco em tons médios. */
function swatchInk(hex: string) {
  const dark = '#000000';
  const light = '#ffffff';
  return contrast(dark, hex) >= contrast(light, hex) ? dark : light;
}

function toneBars(tones: PaletteTone[]) {
  return tones
    .flatMap((tone) => {
      const light = {
        key: `${tone.name}-light`,
        name: tone.dark ? `${tone.name} · claro` : tone.name,
        hex: tone.light,
      };
      if (!tone.dark) return [light];
      return [
        light,
        { key: `${tone.name}-dark`, name: `${tone.name} · escuro`, hex: tone.dark },
      ];
    })
    .sort((a, b) => swatchLuminance(b.hex) - swatchLuminance(a.hex));
}

function ColorPalette() {
  return (
    <div className="flex w-full min-w-0 max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-1">
      {PALETTE.map((family) => (
        <article key={family.name} className="min-w-44 flex-1">
          <h3 className="text-sm font-semibold text-fg">{family.name}</h3>
          <p className="text-xs text-fg-muted">{family.role}</p>
          <ul className="mt-3 overflow-hidden rounded-lg">
            {toneBars(family.tones).map((bar) => (
              <li
                key={bar.key}
                className="flex h-8 items-center justify-between gap-2 px-2 text-[11px] leading-4"
                style={{ backgroundColor: bar.hex, color: swatchInk(bar.hex) }}
              >
                <span className="truncate font-medium">{bar.name}</span>
                <span className="shrink-0 tabular-nums opacity-80">{bar.hex}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function scrollToSection(
  event: MouseEvent<HTMLAnchorElement>,
  scroller: HTMLElement | null,
) {
  const id = event.currentTarget.getAttribute('href')?.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target || !scroller) return;
  event.preventDefault();
  const top =
    target.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    24;
  scroller.scrollTo({ top, behavior: 'smooth' });
  history.replaceState(null, '', `#${id}`);
}

export default function DesignSystemPage() {
  const [dark, setDark] = useState(false);
  const [arena, setArena] = useState('Arena do Lago');
  const [sport, setSport] = useState<string | number>('volei');
  const [covered, setCovered] = useState(true);
  const [surface, setSurface] = useState('areia');
  const [agendaDate, setAgendaDate] = useState(() => new Date());
  const [court, setCourt] = useState('all');
  const [needsNet, setNeedsNet] = useState(true);
  const [sports, setSports] = useState<string[]>(['volei']);
  const [alertOpen, setAlertOpen] = useState(false);
  const [agendaConfirm, setAgendaConfirm] = useState<
    'inativar' | 'cancelar' | 'fixar' | 'ativar' | 'erro' | null
  >(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = 'mpn-agenda-lato';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <div
          data-theme={dark ? 'dark' : 'light'}
          className="mpn-standard flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <PageHeader
            title="Design system"
            action={
              <Switch
                name="ds-tema"
                label="Tema escuro"
                checked={dark}
                onChange={(event) => setDark(event.target.checked)}
              />
            }
          >
            <p className="max-w-2xl text-sm leading-6 text-fg-muted">
              Um de cada. O teal é a marca, azul é o reservado, verde é livre,
              roxo é fixo. O claro é um cinza quase branco e o escuro é o fundo
              da arena.
            </p>
          </PageHeader>

          <nav
            aria-label="Componentes"
            className={`relative z-10 shrink-0 bg-surface px-4 lg:px-8 ${liftShadow}`}
          >
            <ul className="flex gap-1 overflow-x-auto">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(event) => scrollToSection(event, scrollerRef.current)}
                    className="inline-flex h-10 items-center rounded-md px-2.5 text-sm text-fg-muted hover:text-fg"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            ref={scrollerRef}
            className="min-h-0 w-full min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain"
          >
            <div className="flex w-full min-w-0 flex-col gap-8 px-4 py-6 lg:px-8">
              <Section id="cores" title="Cores">
                <ColorPalette />
              </Section>

              <div className="grid items-start gap-10 lg:grid-cols-2">
                <div className="flex flex-col gap-8">
                  <Section id="campo" title="Campo">
                    <div className="max-w-sm">
                      <Input
                        name="ds-arena"
                        title="Nome da arena"
                        hint="Como a arena aparece para quem reserva."
                        value={arena}
                        required
                        onChange={(event) => setArena(event.target.value)}
                      />
                    </div>
                  </Section>

                  <Section id="select" title="Select">
                    <div className="max-w-sm">
                      <Select
                        name="ds-esporte"
                        title="Esporte"
                        value={sport}
                        options={[
                          { id: 'volei', name: 'Vôlei' },
                          { id: 'futebol', name: 'Futebol society' },
                          { id: 'beach', name: 'Beach tennis' },
                        ]}
                        onChange={(event) => setSport(event.target.value)}
                      />
                    </div>
                  </Section>

                  <Section id="checkbox" title="Checkbox">
                    <div className="max-w-lg">
                      <Checkbox
                        name="ds-coberta"
                        label="Quadra coberta"
                        checked={covered}
                        onChange={(event) => setCovered(event.target.checked)}
                      />
                    </div>
                  </Section>

                  <Section id="radio" title="Radio">
                    <RadioGroup
                      name="ds-piso"
                      legend="Piso"
                      value={surface}
                      onChange={(event) => setSurface(event.target.value)}
                      options={[
                        { value: 'areia', label: 'Areia' },
                        { value: 'sintetica', label: 'Sintética' },
                      ]}
                    />
                  </Section>

                  <Section id="botao" title="Botão">
                    <Button>Salvar</Button>
                  </Section>
                </div>

                <div className="flex flex-col gap-8">
                  <Section id="alerta" title="Alerta">
                    <Button onClick={() => setAlertOpen(true)}>Abrir alerta</Button>
                    <Alert
                      open={alertOpen}
                      title="A cobrança deste mês ainda está aberta"
                      confirmLabel="Ver cobrança"
                      onConfirm={() => setAlertOpen(false)}
                      onDismiss={() => setAlertOpen(false)}
                    >
                      Confira o PIX antes de marcar o plano como pago.
                    </Alert>
                  </Section>

                  <Section id="card" title="Card">
                    <Card as="div" className="max-w-xs">
                      <CardLabel as="p">Clientes ativos</CardLabel>
                      <CardMetric className="text-2xl">128</CardMetric>
                    </Card>
                  </Section>

                  <Section id="lista" title="Lista">
                    <ul className="flex flex-col gap-2">
                      <li className={`overflow-hidden rounded-lg bg-surface ${liftShadow}`}>
                        <ListRow title="Arena do Lago" subtitle="Campinas · SP" />
                      </li>
                      <li className={`overflow-hidden rounded-lg bg-surface ${liftShadow}`}>
                        <ListRow title="Society Norte" subtitle="São Paulo · SP" />
                      </li>
                    </ul>
                  </Section>

                  <Section id="badge" title="Badge">
                    <div className="flex flex-wrap items-center gap-3">
                      <SituationBadge situation="active" />
                      <SituationBadge situation="trial" />
                      <SituationBadge situation="expired" />
                      <SituationBadge situation="inactive" />
                    </div>
                  </Section>
                </div>
              </div>

              <Section id="tabela" title="Tabela">
                <Table
                  columns={['Quadra', 'Cidade', 'Dono', 'Situação', 'Representante']}
                  gridClass={sampleTableGrid}
                >
                  <TableRow gridClass={sampleTableGrid}>
                    <p className="truncate text-sm font-medium text-fg">Arena do Lago</p>
                    <p className="truncate text-sm text-fg">Campinas</p>
                    <p className="truncate text-sm text-fg">Ana Lima</p>
                    <SituationBadge situation="active" />
                    <p className="truncate text-sm text-fg-muted">Marina</p>
                  </TableRow>
                  <TableRow gridClass={sampleTableGrid}>
                    <p className="truncate text-sm font-medium text-fg">Society Norte</p>
                    <p className="truncate text-sm text-fg">São Paulo</p>
                    <p className="truncate text-sm text-fg">Pedro Alves</p>
                    <SituationBadge situation="trial" />
                    <p className="truncate text-sm text-fg-muted">—</p>
                  </TableRow>
                </Table>
              </Section>

              <Section id="agenda" title="Agenda">
                <p className="mb-4 max-w-2xl text-sm leading-6 text-fg-muted">
                  Peças que só existem no manager. Usam a mesma paleta, em Lato.
                </p>
                <div className={`ds-manager flex w-full min-w-0 max-w-full flex-col gap-6 rounded-xl bg-surface p-4 sm:p-5 ${liftShadow}`}>
                  <div className="flex items-center gap-2">
                    <CalendarButton
                      selectedDate={agendaDate}
                      setSelectedDate={setAgendaDate}
                    />
                    <div className="min-w-0 flex-1">
                      <DateStrip
                        selectedDate={agendaDate}
                        setSelectedDate={setAgendaDate}
                        daysBefore={1}
                        daysAfter={6}
                      />
                    </div>
                  </div>

                  <LegendAndFilters
                    courtsNameList={['Quadra 1', 'Quadra 2', 'Areia']}
                    courtSelected={court}
                    setCourtSelected={setCourt}
                  />

                  <ul id="item-agenda" className="flex flex-col gap-2">
                    <ReservationItem
                      scheduleId="livre"
                      status={ReservationStatusEnum.AVAILABLE}
                      date={tomorrowIso()}
                      court="Quadra 1"
                      time="19:00"
                      customerName={null}
                    />
                    <ReservationItem
                      scheduleId="reservado"
                      status={ReservationStatusEnum.RESERVED}
                      date={tomorrowIso()}
                      court="Quadra 2"
                      time="20:00"
                      customerName="Ana Lima"
                      isNeedsNetting
                    />
                    <ReservationItem
                      scheduleId="fixo"
                      status={ReservationStatusEnum.FIXED}
                      date={tomorrowIso()}
                      court="Areia"
                      time="21:00"
                      customerName="Time da casa"
                      isEvent
                    />
                  </ul>

                  <OptionToggle
                    name="ds-rede"
                    label="Rede"
                    checked={needsNet}
                    onChange={setNeedsNet}
                    icon={<VoleyNetIcon className="size-5" />}
                  />

                  <CheckboxGroup
                    name="ds-esportes-agenda"
                    title="Esportes"
                    mode="light"
                    value={sports}
                    onChange={setSports}
                    options={[
                      { value: 'volei', label: 'Vôlei' },
                      { value: 'beach', label: 'Beach tennis' },
                      { value: 'futebol', label: 'Futebol society' },
                    ]}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <OptionChip
                      label="Evento"
                      icon={<MdOutlineCelebration size={14} />}
                    />
                    <ReminderBadge count={3} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['inativar', 'Inativar horário'],
                        ['cancelar', 'Cancelar reserva'],
                        ['fixar', 'Fixar horário'],
                        ['ativar', 'Ativar horário'],
                        ['erro', 'Erro ao concluir'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setAgendaConfirm(id)}
                        className="inline-flex min-h-11 items-center rounded-xl bg-canvas px-3 text-base font-semibold text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              <ConfirmSheet
                isOpen={agendaConfirm === 'inativar'}
                title="Inativar horário?"
                description="O horário deixa de aparecer como disponível na agenda do dia."
                confirmLabel="Inativar"
                tone="danger"
                onConfirm={() => setAgendaConfirm(null)}
                onClose={() => setAgendaConfirm(null)}
              />
              <ConfirmSheet
                isOpen={agendaConfirm === 'cancelar'}
                title="Cancelar reserva?"
                description="A reserva deste horário será cancelada. Essa ação não pode ser desfeita."
                confirmLabel="Cancelar reserva"
                tone="danger"
                onConfirm={() => setAgendaConfirm(null)}
                onClose={() => setAgendaConfirm(null)}
              />
              <ConfirmSheet
                isOpen={agendaConfirm === 'fixar'}
                title="Fixar horário?"
                description="O cliente fica com este horário de forma recorrente."
                confirmLabel="Fixar horário"
                confirmIcon={
                  <StatusIcons.fixed size={20} className="shrink-0" aria-hidden />
                }
                tone="neutral"
                onConfirm={() => setAgendaConfirm(null)}
                onClose={() => setAgendaConfirm(null)}
              />
              <ConfirmSheet
                isOpen={agendaConfirm === 'ativar'}
                title="Ativar horário?"
                description="O horário volta a aparecer como disponível para reserva."
                confirmLabel="Ativar horário"
                tone="success"
                onConfirm={() => setAgendaConfirm(null)}
                onClose={() => setAgendaConfirm(null)}
              />
              <ConfirmSheet
                isOpen={agendaConfirm === 'erro'}
                title="Não foi possível concluir"
                description="A agenda não mudou. Tente de novo."
                confirmLabel="Entendi"
                tone="danger"
                alertOnly
                onConfirm={() => setAgendaConfirm(null)}
                onClose={() => setAgendaConfirm(null)}
              />
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
