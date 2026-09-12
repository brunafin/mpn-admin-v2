import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { MdArrowBack, MdOutlineSearch } from 'react-icons/md';
import {
  COMPETITOR_LABEL,
  importProspects,
  listProspectCities,
  listProspects,
  OUTREACH_LABEL,
  searchProspects,
  type GoogleCourtProspect,
  type GoogleCourtSearchHit,
  type OutreachStatus,
  type ProspectCity,
} from '../api/prospects';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { Badge, OutreachBadge } from '../components/Badge';
import Button from '../components/Button';
import EmptyState, { emptyStateActionClassName } from '../components/EmptyState';
import Input from '../components/Input';
import ListRow from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import Select from '../components/Select';
import { ClientsListSkeleton } from '../components/Skeleton';
import { formatPhone } from '../utils/format';

const UF_OPTIONS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
].map((uf) => ({ id: uf, name: uf }));

const STATUS_FILTERS: Array<{ id: '' | OutreachStatus; name: string }> = [
  { id: '', name: 'Todos' },
  { id: 'new', name: OUTREACH_LABEL.new },
  { id: 'contacted', name: OUTREACH_LABEL.contacted },
  { id: 'waiting', name: OUTREACH_LABEL.waiting },
  { id: 'interested', name: OUTREACH_LABEL.interested },
  { id: 'competitor', name: OUTREACH_LABEL.competitor },
  { id: 'won', name: OUTREACH_LABEL.won },
];

const emptyCounts = {
  new: 0,
  contacted: 0,
  waiting: 0,
  interested: 0,
  won: 0,
  lost: 0,
  competitor: 0,
  skip: 0,
};

const filterSelectClass =
  'h-10 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-8 text-sm text-fg focus:outline-none focus-visible:ring-1 focus-visible:ring-fg';

export default function ProspectsPage() {
  const [mode, setMode] = useState<'portfolio' | 'search'>('portfolio');
  const [items, setItems] = useState<GoogleCourtProspect[]>([]);
  const [visibleQ, setVisibleQ] = useState('');
  const [cities, setCities] = useState<ProspectCity[]>([]);
  const [counts, setCounts] = useState(emptyCounts);
  const [total, setTotal] = useState(0);
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | OutreachStatus>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
      setError('');
    }
    const cityParts = cityFilter.split('|');
    return Promise.all([
      listProspects({
        city: cityParts[0] || undefined,
        uf: cityParts[1] || undefined,
        status: statusFilter,
        limit: 100,
      }),
      listProspectCities(),
    ])
      .then(([list, cityRows]) => {
        setItems(list.items);
        setCounts(list.counts);
        setTotal(list.total);
        setCities(cityRows);
        setError('');
      })
      .catch(() => {
        if (!opts?.silent) {
          setError('Não foi possível carregar os prospectos.');
        }
      })
      .finally(() => {
        if (!opts?.silent) setLoading(false);
      });
  };

  useEffect(() => {
    void load();
    // cityFilter/statusFilter are the server-side filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityFilter, statusFilter]);

  const visibleItems = useMemo(() => {
    const term = visibleQ.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [item.name, item.phone, item.fullAddress, item.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, visibleQ]);

  const metrics = useMemo(
    () => [
      { label: 'No portfólio', value: total },
      { label: 'Novos', value: counts.new },
      { label: 'Contatados', value: counts.contacted + counts.waiting },
      { label: 'Interessados', value: counts.interested },
    ],
    [counts, total],
  );

  if (mode === 'search') {
    return (
      <SearchCityView
        onBack={() => setMode('portfolio')}
        onImported={(city, uf) => {
          const next = `${city}|${uf}`;
          if (next === cityFilter) {
            void load({ silent: true });
          } else {
            setCityFilter(next);
          }
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
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setMode('search')}
            >
              <MdOutlineSearch size={16} aria-hidden />
              Buscar cidade
            </Button>
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
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
                {metrics.map((item) => (
                  <div key={item.label} className="bg-surface px-4 py-3">
                    <p className="text-xs text-fg-muted">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="sr-only">Buscar por nome</span>
                  <input
                    type="search"
                    value={visibleQ}
                    onChange={(event) => setVisibleQ(event.target.value)}
                    placeholder="Nome, telefone ou endereço"
                    autoComplete="off"
                    className="mpn-field h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-fg"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Filtrar por cidade</span>
                  <select
                    value={cityFilter}
                    onChange={(event) => setCityFilter(event.target.value)}
                    className={filterSelectClass}
                  >
                    <option value="">Todas as cidades</option>
                    {cities.map((row) => (
                      <option
                        key={`${row.city}|${row.uf || ''}`}
                        value={`${row.city}|${row.uf || ''}`}
                      >
                        {row.city}
                        {row.uf ? `/${row.uf}` : ''} ({row.count})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="sr-only">Filtrar por status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as '' | OutreachStatus)
                    }
                    className={filterSelectClass}
                  >
                    {STATUS_FILTERS.map((option) => (
                      <option key={option.id || 'all'} value={option.id}>
                        {option.id === '' ? 'Todos os status' : option.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {visibleItems.length === 0 ? (
                <EmptyState
                  title={
                    items.length === 0
                      ? 'Portfólio vazio'
                      : 'Nenhuma quadra encontrada'
                  }
                  description={
                    items.length === 0
                      ? 'Busque uma cidade no Google e puxe as quadras que quiser acompanhar.'
                      : 'Ajuste a busca e tente de novo.'
                  }
                  action={
                    <button
                      type="button"
                      className={emptyStateActionClassName()}
                      onClick={() => setMode('search')}
                    >
                      Buscar cidade
                    </button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                  {visibleItems.map((item) => (
                    <li key={item.googlePlaceId}>
                      <ListRow
                        to={`/prospectos/${encodeURIComponent(item.googlePlaceId)}`}
                        title={item.name}
                        badge={<OutreachBadge status={item.outreachStatus} />}
                        subtitle={[
                          item.city && item.uf
                            ? `${item.city}/${item.uf}`
                            : item.city || item.uf,
                          item.phone ? formatPhone(item.phone) : 'Sem telefone',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        meta={[
                          item.competitor !== 'unknown'
                            ? COMPETITOR_LABEL[item.competitor]
                            : null,
                          item.alreadyRegistered ? 'Já é cliente' : null,
                          item.contactedAt ? 'Já houve contato' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
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
  const [uf, setUf] = useState('SP');
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
      setHint(
        result.items.length === 0
          ? 'Nenhuma quadra relevante nessa busca.'
          : `${result.found} encontradas · ${withPhone} com telefone · ${result.alreadyInPortfolio} já no portfólio.`,
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
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-2 py-1.5 lg:px-6">
          <button
            type="button"
            aria-label="Voltar ao portfólio"
            onClick={onBack}
            className="mpn-tap flex size-9 items-center justify-center rounded-md text-fg hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <MdArrowBack size={20} aria-hidden />
          </button>
          <h1 className="min-w-0 truncate text-sm font-medium text-fg">
            Buscar no Google
          </h1>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          <form onSubmit={onSearch} className="max-w-xl">
            <p className="mb-3 text-sm text-fg-muted">
              Procura “quadra esportiva” e “society” na cidade. Nada entra no
              portfólio até você puxar as que quiser.
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
              title="Termo extra (opcional)"
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
                  <label className="flex items-center gap-2 text-sm text-fg">
                    <input
                      type="checkbox"
                      className="size-4 accent-fg"
                      checked={phoneOnly}
                      onChange={(event) => setPhoneOnly(event.target.checked)}
                    />
                    Só com telefone
                  </label>
                  {visibleHits.some((hit) => !hit.inPortfolio) ? (
                    <button
                      type="button"
                      onClick={toggleAllNew}
                      className="text-sm font-medium text-fg underline-offset-2 hover:underline"
                    >
                      Alternar novas
                    </button>
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
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                  {visibleHits.map((hit) => (
                    <li key={hit.googlePlaceId}>
                      <label className="mpn-tap flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-canvas">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0 accent-fg"
                          checked={Boolean(selected[hit.googlePlaceId])}
                          onChange={(event) =>
                            setSelected((current) => ({
                              ...current,
                              [hit.googlePlaceId]: event.target.checked,
                            }))
                          }
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2">
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
                          <span className="mt-0.5 block truncate text-sm text-fg-muted">
                            {[
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
                            <span className="mt-1 block text-xs text-fg-muted">
                              {hit.fullAddress}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
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

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message[0]) return String(message[0]);
  }
  return fallback;
}
