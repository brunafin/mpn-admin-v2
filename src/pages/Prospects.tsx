import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { MdArrowBack, MdOutlineFilterAlt, MdOutlineSearch } from 'react-icons/md';
import {
  COMPETITOR_LABEL,
  importProspects,
  listProspectCities,
  listProspects,
  OUTREACH_LABEL,
  PLACE_KIND_LABEL,
  sanitizeProspects,
  searchProspects,
  type GoogleCourtProspect,
  type GoogleCourtSearchHit,
  type OutreachStatus,
  type ProspectCity,
} from '../api/prospects';
import AppLayout, { BACK_BAR, BACK_TITLE, PAGE_SHELL } from '../components/AppLayout';
import { Badge, OutreachBadge } from '../components/Badge';
import Button, { buttonClassName } from '../components/Button';
import Checkbox from '../components/Checkbox';
import { choiceRowClass } from '../components/Checkbox/row';
import CheckMark from '../components/Checkbox/Mark';
import EmptyState, { emptyStateActionClassName } from '../components/EmptyState';
import FilterChip from '../components/FilterChip';
import FormSheet from '../components/FormSheet';
import Input, { fieldOutlineClass } from '../components/Input';
import { listClassName } from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import Select from '../components/Select';
import Table, { TableCell, TableRow } from '../components/Table';
import { ClientsListSkeleton } from '../components/Skeleton';
import { UF_OPTIONS } from '../constants/ufs';
import { samePlaceName } from '../utils/addressCity';
import { formatCalendarDate, formatPhone, todayKeyBrazil } from '../utils/format';
import {
  parseWeekCityKey,
  readWeekCity,
  weekCityKey,
  writeWeekCity,
} from '../utils/weekCity';

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{ id: '' | OutreachStatus; name: string }> = [
  { id: '', name: 'Todos' },
  { id: 'new', name: OUTREACH_LABEL.new },
  { id: 'contacted', name: OUTREACH_LABEL.contacted },
  { id: 'waiting', name: OUTREACH_LABEL.waiting },
  { id: 'interested', name: OUTREACH_LABEL.interested },
  { id: 'competitor', name: OUTREACH_LABEL.competitor },
  { id: 'won', name: OUTREACH_LABEL.won },
];

export default function ProspectsPage() {
  const [searchParams] = useSearchParams();
  if (searchParams.get('fila') === 'abordar') return <ApproachQueuePage />;
  return <PortfolioProspects />;
}

function PortfolioProspects() {
  const [mode, setMode] = useState<'portfolio' | 'search'>('portfolio');
  const [items, setItems] = useState<GoogleCourtProspect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [visibleQ, setVisibleQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [cities, setCities] = useState<ProspectCity[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | OutreachStatus>('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sanitizing, setSanitizing] = useState(false);
  const [sanitizeHint, setSanitizeHint] = useState('');
  const debouncedQRef = useRef('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = visibleQ.trim();
      if (debouncedQRef.current === next) return;
      debouncedQRef.current = next;
      setDebouncedQ(next);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [visibleQ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const cityParts = cityFilter.split('|');
    Promise.all([
      listProspects({
        q: debouncedQ || undefined,
        city: cityParts[0] || undefined,
        uf: cityParts[1] || undefined,
        status: statusFilter,
        page,
        limit: PAGE_SIZE,
      }),
      listProspectCities(),
    ])
      .then(([list, cityRows]) => {
        if (cancelled) return;
        setItems(list.items);
        setTotal(list.total);
        setCities(cityRows);
        setError('');
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os prospectos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cityFilter, statusFilter, debouncedQ, page, reloadKey]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);

  const onSanitize = async () => {
    setSanitizing(true);
    setSanitizeHint('');
    setError('');
    try {
      const result = await sanitizeProspects();
      setSanitizeHint(
        result.updated === 0
          ? 'Nenhuma cidade precisou de correção.'
          : result.updated === 1
            ? '1 quadra foi para a cidade do endereço.'
            : `${result.updated} quadras foram para a cidade do endereço.`,
      );
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch {
      setError('Não foi possível corrigir as cidades.');
    } finally {
      setSanitizing(false);
    }
  };

  if (mode === 'search') {
    return (
      <SearchCityView
        onBack={() => setMode('portfolio')}
        onImported={(city, uf) => {
          const next = `${city}|${uf}`;
          setPage(1);
          if (next !== cityFilter) setCityFilter(next);
          setReloadKey((current) => current + 1);
          setMode('portfolio');
        }}
      />
    );
  }

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader
          title="Prospectos"
          action={
            <div className="flex items-center gap-2">
              <Link
                to="/prospectos?fila=abordar"
                className={buttonClassName({ variant: 'secondary', size: 'sm' })}
              >
                Fila da semana
              </Link>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setMode('search')}
              >
                <MdOutlineSearch size={16} aria-hidden />
                Buscar cidade
              </Button>
            </div>
          }
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {loading && items.length === 0 ? (
            <ClientsListSkeleton />
          ) : (
            <div className="space-y-6">
              <ProspectFilters
                query={visibleQ}
                onQueryChange={setVisibleQ}
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                city={cityFilter}
                cities={cities}
                onCityChange={(value) => {
                  setCityFilter(value);
                  setPage(1);
                }}
                status={statusFilter}
                onStatusChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={() => {
                    void onSanitize();
                  }}
                  disabled={sanitizing}
                >
                  {sanitizing ? 'Corrigindo…' : 'Corrigir cidades pelo endereço'}
                </Button>
                {sanitizeHint ? (
                  <p className="text-sm text-fg-muted">{sanitizeHint}</p>
                ) : null}
              </div>

              {items.length === 0 && !loading ? (
                <EmptyState
                  title={
                    !cityFilter && !statusFilter && !debouncedQ
                      ? 'Portfólio vazio'
                      : 'Nenhuma quadra encontrada'
                  }
                  description={
                    !cityFilter && !statusFilter && !debouncedQ
                      ? 'Busque uma cidade no Google e puxe as quadras que quiser acompanhar.'
                      : 'Ajuste a busca ou os filtros e tente de novo.'
                  }
                  action={
                    !cityFilter && !statusFilter && !debouncedQ ? (
                      <button
                        type="button"
                        className={emptyStateActionClassName()}
                        onClick={() => setMode('search')}
                      >
                        Buscar cidade
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <Table
                  columns={['Quadra', 'Cidade', 'Telefone', 'Status', 'Notas']}
                  gridClass="lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_8.5rem_7rem_minmax(0,1fr)]"
                  className={loading ? 'opacity-60' : ''}
                >
                  {items.map((item) => {
                    const notes = [
                      item.placeKind ? PLACE_KIND_LABEL[item.placeKind] : null,
                      item.nextActionOn
                        ? `próxima ${formatCalendarDate(item.nextActionOn)}`
                        : null,
                      item.competitor !== 'unknown'
                        ? COMPETITOR_LABEL[item.competitor]
                        : null,
                      item.alreadyRegistered ? 'Já é cliente' : null,
                      item.contactedAt ? 'Já houve contato' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    const place = [item.city, item.uf].filter(Boolean).join('/');
                    return (
                      <TableRow
                        key={item.googlePlaceId}
                        to={`/prospectos/${encodeURIComponent(item.googlePlaceId)}`}
                        gridClass="lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_8.5rem_7rem_minmax(0,1fr)]"
                        label={item.name}
                      >
                        <TableCell>
                          <p className="truncate text-sm font-medium text-fg">
                            {item.name}
                          </p>
                        </TableCell>
                        <TableCell label="Cidade">
                          <p className="truncate text-sm text-fg">
                            {place || '—'}
                          </p>
                        </TableCell>
                        <TableCell label="Telefone">
                          <p className="truncate text-sm tabular-nums text-fg">
                            {item.phone ? formatPhone(item.phone) : '—'}
                          </p>
                        </TableCell>
                        <TableCell label="Status">
                          <OutreachBadge status={item.outreachStatus} />
                        </TableCell>
                        <TableCell label="Notas">
                          <p className="truncate text-sm text-fg-muted">
                            {notes || '—'}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Table>
              )}

              {total > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm tabular-nums text-fg-muted">
                    {rangeFrom}–{rangeTo} de {total}
                  </p>
                  {pageCount > 1 ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((current) => current - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={page >= pageCount || loading}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        Próxima
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function ProspectFilters({
  query,
  onQueryChange,
  open,
  onOpenChange,
  city,
  cities,
  onCityChange,
  status,
  onStatusChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: string;
  cities: ProspectCity[];
  onCityChange: (value: string) => void;
  status: '' | OutreachStatus;
  onStatusChange: (value: '' | OutreachStatus) => void;
}) {
  const active = (city ? 1 : 0) + (status ? 1 : 0);

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="prospecto-busca" className="sr-only">
            Buscar por nome
          </label>
          <input
            id="prospecto-busca"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Nome, telefone ou endereço"
            autoComplete="off"
            className={`${fieldOutlineClass} w-full pe-11`}
          />
          <span className="pointer-events-none absolute right-0.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-fg-muted">
            <MdOutlineSearch size={18} aria-hidden />
          </span>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={
            active
              ? `Filtros, ${active} ${active === 1 ? 'selecionado' : 'selecionados'}`
              : 'Filtros'
          }
          className={buttonClassName({
            variant: active ? 'primary' : 'secondary',
            size: 'md',
            className: 'shrink-0 px-3',
          })}
        >
          <MdOutlineFilterAlt size={18} aria-hidden />
          Filtros
          {active ? <span className="tabular-nums">{active}</span> : null}
        </button>
      </div>
      {active ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {city ? (
            <FilterChip
              label={
                cities.find((row) => `${row.city}|${row.uf || ''}` === city)
                  ?.city || city.replace('|', '/')
              }
              onRemove={() => onCityChange('')}
            />
          ) : null}
          {status ? (
            <FilterChip
              label={
                STATUS_FILTERS.find((option) => option.id === status)?.name ||
                status
              }
              onRemove={() => onStatusChange('')}
            />
          ) : null}
        </div>
      ) : null}

      <FormSheet
        isOpen={open}
        title="Filtros"
        onClose={() => onOpenChange(false)}
      >
        <Select
          name="prospectos-cidade"
          title="Cidade"
          value={city}
          omitPlaceholder
          options={[
            { id: '', name: 'Todas as cidades' },
            ...cities.map((row) => ({
              id: `${row.city}|${row.uf || ''}`,
              name: `${row.city}${row.uf ? `/${row.uf}` : ''} (${row.count})`,
            })),
          ]}
          onChange={(event) => onCityChange(event.target.value)}
        />
        <Select
          name="prospectos-status"
          title="Status"
          value={status}
          omitPlaceholder
          options={STATUS_FILTERS.map((option) => ({
            id: option.id,
            name: option.id === '' ? 'Todos os status' : option.name,
          }))}
          onChange={(event) =>
            onStatusChange(event.target.value as '' | OutreachStatus)
          }
        />
        {active ? (
          <button
            type="button"
            onClick={() => {
              onCityChange('');
              onStatusChange('');
            }}
            className={buttonClassName({ variant: 'ghost', fullWidth: true })}
          >
            Limpar filtros
          </button>
        ) : null}
      </FormSheet>
    </>
  );
}

function SearchCityView({
  onBack,
  onImported,
}: {
  onBack: () => void;
  onImported: (city: string, uf: string) => void;
}) {
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('RS');
  const [extraQuery, setExtraQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [formError, setFormError] = useState('');
  const [hits, setHits] = useState<GoogleCourtSearchHit[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [hint, setHint] = useState('');
  const [phoneOnly, setPhoneOnly] = useState(true);

  const visibleHits = useMemo(() => {
    if (!hits) return [];
    if (!phoneOnly) return hits;
    return hits.filter((hit) => Boolean(hit.phone));
  }, [hits, phoneOnly]);

  const selectedHits = useMemo(
    () => visibleHits.filter((hit) => selected[hit.googlePlaceId]),
    [visibleHits, selected],
  );

  const onSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!city.trim()) {
      setFormError('Informe a cidade.');
      return;
    }
    setSearching(true);
    setFormError('');
    setHint('');
    try {
      const result = await searchProspects({
        city: city.trim(),
        uf,
        queries: extraQuery.trim() ? [extraQuery.trim()] : undefined,
      });
      setHits(result.items);
      setSelected(
        Object.fromEntries(
          result.items.map((hit) => [
            hit.googlePlaceId,
            !hit.inPortfolio && Boolean(hit.phone),
          ]),
        ),
      );
      const withPhone = result.items.filter((hit) => hit.phone).length;
      const outside = result.outsideCity
        ? `${result.outsideCity} de outra cidade ficaram de fora`
        : null;
      setHint(
        result.items.length === 0
          ? outside || 'Nenhuma quadra relevante nessa busca.'
          : [
              `${result.found} encontradas`,
              `${withPhone} com telefone`,
              `${result.alreadyInPortfolio} já no portfólio`,
              outside,
            ]
              .filter(Boolean)
              .join(' · '),
      );
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível buscar no Google.'));
    } finally {
      setSearching(false);
    }
  };

  const onImport = async () => {
    if (!hits || selectedHits.length === 0) {
      setFormError('Escolha ao menos uma quadra.');
      return;
    }
    setImporting(true);
    setFormError('');
    try {
      const result = await importProspects({
        city: city.trim(),
        uf,
        places: selectedHits.map((hit) => ({
          googlePlaceId: hit.googlePlaceId,
          name: hit.name,
          phone: hit.phone,
          fullAddress: hit.fullAddress,
          website: hit.website,
          googleMapsUri: hit.googleMapsUri,
          rating: hit.rating,
          userRatingsTotal: hit.userRatingsTotal,
          latitude: hit.latitude,
          longitude: hit.longitude,
        })),
      });
      onImported(result.city, result.uf);
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível puxar para o portfólio.'),
      );
    } finally {
      setImporting(false);
    }
  };

  const toggleAllNew = () => {
    if (!hits) return;
    const pool = phoneOnly ? hits.filter((hit) => hit.phone) : hits;
    const shouldSelect = pool.some(
      (hit) => !hit.inPortfolio && !selected[hit.googlePlaceId],
    );
    setSelected((current) => ({
      ...current,
      ...Object.fromEntries(
        pool.map((hit) => [
          hit.googlePlaceId,
          hit.inPortfolio ? current[hit.googlePlaceId] : shouldSelect,
        ]),
      ),
    }));
  };

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <div className={BACK_BAR}>
          <button
            type="button"
            aria-label="Voltar ao portfólio"
            onClick={onBack}
            className="mpn-tap flex size-9 items-center justify-center rounded-md text-fg hover:bg-arena-hover"
          >
            <MdArrowBack size={20} aria-hidden />
          </button>
          <h1 className={BACK_TITLE}>Buscar no Google</h1>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          <form onSubmit={onSearch} className="max-w-xl">
            <p className="mb-3 text-sm text-fg-muted">
              Procura “quadra esportiva” e “society” na cidade. Endereço de
              outra cidade fica de fora. Nada entra no portfólio até você
              puxar as que quiser.
            </p>
            <Input
              name="city"
              title="Cidade"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
              autoComplete="address-level2"
            />
            <Select
              name="uf"
              title="UF"
              value={uf}
              options={UF_OPTIONS}
              onChange={(event) => setUf(event.target.value)}
              required
            />
            <Input
              name="extraQuery"
              title="Termo extra"
              placeholder="beach tennis, paddle…"
              value={extraQuery}
              onChange={(event) => setExtraQuery(event.target.value)}
            />
            {formError ? (
              <p className="mb-3 text-sm font-medium text-danger" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" disabled={searching}>
              {searching ? 'Buscando…' : 'Buscar quadras'}
            </Button>
          </form>

          {hits ? (
            <div className="mt-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-fg-muted">{hint}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Checkbox
                    name="phoneOnly"
                    label="Só com telefone"
                    checked={phoneOnly}
                    onChange={(event) => setPhoneOnly(event.target.checked)}
                  />
                  {visibleHits.some((hit) => !hit.inPortfolio) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={toggleAllNew}
                    >
                      {visibleHits.some(
                        (hit) => !hit.inPortfolio && !selected[hit.googlePlaceId],
                      )
                        ? 'Selecionar todas'
                        : 'Desmarcar todas'}
                    </Button>
                  ) : null}
                </div>
              </div>

              {visibleHits.length === 0 ? (
                <EmptyState
                  title={
                    hits.length === 0
                      ? 'Nenhuma quadra nessa busca'
                      : 'Nenhuma quadra com telefone'
                  }
                  description={
                    hits.length === 0
                      ? 'Tente outro termo ou outra cidade.'
                      : 'Desmarque “Só com telefone” para ver o restante.'
                  }
                  className="py-10"
                />
              ) : (
                <ul className={listClassName}>
                  {visibleHits.map((hit) => {
                    const checked = Boolean(selected[hit.googlePlaceId]);
                    return (
                      <li key={hit.googlePlaceId}>
                        <label
                          className={choiceRowClass(
                            checked,
                            'w-full items-start! rounded-none! shadow-none!',
                          )}
                        >
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={checked}
                            onChange={(event) =>
                              setSelected((current) => ({
                                ...current,
                                [hit.googlePlaceId]: event.target.checked,
                              }))
                            }
                          />
                          <CheckMark checked={checked} />
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="min-w-0 truncate text-sm font-medium text-fg">
                                {hit.name}
                              </span>
                              {hit.inPortfolio ? (
                                <Badge>No portfólio</Badge>
                              ) : (
                                <Badge tone="success">Nova</Badge>
                              )}
                              {hit.outreachStatus ? (
                                <OutreachBadge status={hit.outreachStatus} />
                              ) : null}
                            </span>
                            <span className="mt-0.5 block truncate text-sm font-normal text-fg-muted">
                              {[
                                hit.city &&
                                (!samePlaceName(hit.city, city) ||
                                  (hit.uf || '').toUpperCase() !== uf)
                                  ? [hit.city, hit.uf].filter(Boolean).join('/')
                                  : null,
                                hit.phone ? formatPhone(hit.phone) : 'Sem telefone',
                                hit.competitor !== 'unknown'
                                  ? COMPETITOR_LABEL[hit.competitor]
                                  : null,
                                hit.alreadyRegistered ? 'Já é cliente' : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                            {hit.fullAddress ? (
                              <span className="mt-1 block truncate text-xs font-normal text-fg-muted">
                                {hit.fullAddress}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}

              {visibleHits.length > 0 ? (
                <Button
                  type="button"
                  disabled={importing || selectedHits.length === 0}
                  onClick={() => {
                    void onImport();
                  }}
                >
                  {importing
                    ? 'Puxando…'
                    : `Puxar ${selectedHits.length} para o portfólio`}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}

function actionWhen(value: string | null): string {
  if (!value) return 'Sem data';
  const today = todayKeyBrazil();
  if (value < today) return `Atrasada · ${formatCalendarDate(value)}`;
  if (value === today) return 'Hoje';
  return formatCalendarDate(value) || value;
}

function ApproachQueuePage() {
  const [weekCity, setWeekCity] = useState(readWeekCity);
  const [cities, setCities] = useState<ProspectCity[]>([]);
  const [items, setItems] = useState<GoogleCourtProspect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [visibleQ, setVisibleQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedQRef = useRef('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = visibleQ.trim();
      if (debouncedQRef.current === next) return;
      debouncedQRef.current = next;
      setDebouncedQ(next);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [visibleQ]);

  useEffect(() => {
    let cancelled = false;
    listProspectCities()
      .then((rows) => {
        if (!cancelled) setCities(rows);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!weekCity) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    listProspects({
      q: debouncedQ || undefined,
      city: weekCity.city,
      uf: weekCity.uf || undefined,
      hasPhone: true,
      hourly: 'yes',
      due: true,
      open: true,
      sort: 'reviews',
      page,
      limit: PAGE_SIZE,
    })
      .then((list) => {
        if (cancelled) return;
        setItems(list.items);
        setTotal(list.total);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar a fila.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekCity, debouncedQ, page]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <div className={BACK_BAR}>
          <Link
            to="/inicio"
            aria-label="Voltar ao início"
            className="mpn-tap flex size-9 items-center justify-center rounded-md text-fg hover:bg-arena-hover"
          >
            <MdArrowBack size={20} aria-hidden />
          </Link>
          <h1 className={BACK_TITLE}>Abordar</h1>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          <Select
            name="cidade-da-semana"
            title="Cidade da semana"
            value={weekCityKey(weekCity)}
            omitPlaceholder
            options={[
              { id: '', name: 'Escolha a cidade' },
              ...cities.map((row) => ({
                id: `${row.city}|${row.uf || ''}`,
                name: `${row.city}${row.uf ? `/${row.uf}` : ''} (${row.count})`,
              })),
            ]}
            onChange={(event) => {
              const next = parseWeekCityKey(event.target.value);
              writeWeekCity(next);
              setWeekCity(next);
              setPage(1);
            }}
          />
          <p className="mb-4 text-sm text-fg-muted">
            Com telefone, que aluga hora ou ainda não foi marcado. Próxima
            ação futura fica de fora. As mais avaliadas no Google vêm primeiro.
          </p>

          <div className="relative mb-4 max-w-xl">
            <label htmlFor="fila-busca" className="sr-only">
              Buscar na fila
            </label>
            <input
              id="fila-busca"
              type="search"
              value={visibleQ}
              onChange={(event) => setVisibleQ(event.target.value)}
              placeholder="Nome ou telefone"
              autoComplete="off"
              className={`${fieldOutlineClass} w-full pe-11`}
            />
            <span className="pointer-events-none absolute right-0.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-fg-muted">
              <MdOutlineSearch size={18} aria-hidden />
            </span>
          </div>

          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {!weekCity ? (
            <EmptyState
              title="Escolha a cidade da semana"
              description="A fila das centenas de quadras só abre depois desse corte."
            />
          ) : loading && items.length === 0 ? (
            <ClientsListSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              title="Nada para abordar hoje"
              description="Quem não tem telefone, não aluga hora, fechou ou tem próxima ação futura fica de fora."
            />
          ) : (
            <Table
              columns={['Quadra', 'Avaliações', 'Tipo', 'Próxima ação']}
              gridClass="lg:grid-cols-[minmax(0,1.6fr)_8rem_8rem_9rem]"
              className={loading ? 'opacity-60' : ''}
            >
              {items.map((item) => (
                <TableRow
                  key={item.googlePlaceId}
                  to={`/prospectos/${encodeURIComponent(item.googlePlaceId)}?from=abordar`}
                  gridClass="lg:grid-cols-[minmax(0,1.6fr)_8rem_8rem_9rem]"
                  label={item.name}
                >
                  <TableCell>
                    <p className="truncate text-sm font-medium text-fg">
                      {item.name}
                    </p>
                    <p className="truncate text-sm text-fg-muted">
                      {item.phone ? formatPhone(item.phone) : '—'}
                    </p>
                  </TableCell>
                  <TableCell label="Avaliações">
                    <p className="text-sm tabular-nums text-fg">
                      {item.userRatingsTotal ?? '—'}
                      {item.rating != null ? ` · ${item.rating.toFixed(1)}` : ''}
                    </p>
                  </TableCell>
                  <TableCell label="Tipo">
                    <p className="truncate text-sm text-fg">
                      {item.placeKind ? PLACE_KIND_LABEL[item.placeKind] : '—'}
                    </p>
                  </TableCell>
                  <TableCell label="Próxima ação">
                    <p className="text-sm text-fg">{actionWhen(item.nextActionOn)}</p>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}

          {total > 0 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm tabular-nums text-fg-muted">
                {rangeFrom}–{rangeTo} de {total}
              </p>
              {pageCount > 1 ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={page >= pageCount || loading}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message[0]) return String(message[0]);
  }
  return fallback;
}
