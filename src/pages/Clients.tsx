import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MdOutlineChevronRight,
  MdOutlineSearch,
  MdSort,
} from 'react-icons/md';
import {
  listClients,
  type PartnerStatus,
  type PlatformClientListItem,
} from '../api/clients';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import Input from '../components/Input';
import { PageEyebrow } from '../components/PageTitle';
import { ClientsListSkeleton } from '../components/Skeleton';
import SortSheet from '../components/SortSheet';
import { formatCurrencyBRL } from '../utils/formatCurrency';
import { formatDate, formatDateTime } from '../utils/format';

type SortOption = 'name' | 'created_at' | 'last_login_at' | 'status';

const SORT_OPTIONS: Array<{
  id: SortOption;
  label: string;
  description: string;
}> = [
  { id: 'name', label: 'A–Z', description: 'Nome da arena' },
  { id: 'created_at', label: 'Criação', description: 'Mais recentes primeiro' },
  {
    id: 'last_login_at',
    label: 'Último acesso',
    description: 'Quem entrou por último',
  },
  {
    id: 'status',
    label: 'Status',
    description: 'Ativo → onboarding → inativo',
  },
];

export default function ClientsPage() {
  const [items, setItems] = useState<PlatformClientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('last_login_at');
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => {
    return {
      q: search || undefined,
      sort,
      limit: 100,
    };
  }, [search, sort]);

  const sortLabel =
    SORT_OPTIONS.find((option) => option.id === sort)?.label ?? 'Ordenar';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listClients(params)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Não foi possível carregar os clientes.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSearch(q.trim());
  }

  return (
    <AppLayout>
      <section className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden bg-master text-text-light lg:max-w-5xl">
        <form
          onSubmit={handleSearchSubmit}
          className="shrink-0 px-4 pb-3 pt-4 lg:px-8 lg:pt-6"
        >
          <div className="rounded-2xl bg-master-light p-4">
            <div className="flex items-stretch gap-2">
              <div className="min-w-0 flex-1 [&>div]:mb-0">
                <label htmlFor="search" className="sr-only">
                  Buscar
                </label>
                <Input
                  name="search"
                  placeholder="Arena ou dono…"
                  type="search"
                  mode="dark"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  enterKeyHint="search"
                />
              </div>
              <button
                type="submit"
                aria-label="Buscar"
                className="mpn-tap flex w-14 shrink-0 items-center justify-center self-stretch rounded-xl bg-accent-blue text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white enabled:active:brightness-85"
              >
                <MdOutlineSearch size={26} aria-hidden />
              </button>
            </div>
          </div>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <PageEyebrow>Clientes</PageEyebrow>
              <p className="mt-1 text-sm text-text-light/55">
                {loading ? 'Carregando…' : `${total} cliente(s)`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSortOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sortOpen}
              className="mpn-tap flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-master-light px-3 text-sm font-semibold text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              <MdSort size={20} aria-hidden />
              <span className="max-w-24 truncate">{sortLabel}</span>
            </button>
          </div>

          {error ? (
            <p
              className="mb-3 text-base font-medium text-danger-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {loading && items.length === 0 ? <ClientsListSkeleton /> : null}

          {!loading && items.length === 0 ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Ajuste a busca e tente de novo."
            />
          ) : null}

          {items.length > 0 ? (
            <ul
              className={`space-y-2 transition-opacity lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 ${
                loading ? 'opacity-60' : ''
              }`}
              aria-busy={loading}
            >
              {items.map((item) => (
                <li key={`${item.kind}-${item.publicId}`}>
                  <Link
                    to={`/clientes/${item.publicId}`}
                    className="mpn-tap flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-master-light px-4 py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-baseline gap-2">
                          <p className="truncate text-lg font-semibold leading-6 text-text-light">
                            {item.name}
                          </p>
                          {item.kind === 'company' &&
                          !item.isTrial &&
                          item.partnerStatus === 'active' &&
                          item.plan ? (
                            <span className="shrink-0 text-base font-medium leading-6 text-text-light/75">
                              ({formatCurrencyBRL(Number(item.monthlyFee ?? 0))})
                            </span>
                          ) : null}
                        </div>
                        <PartnerStatusPill status={item.partnerStatus} />
                      </div>

                      <p className="mt-1 truncate text-base leading-6 text-text-light/80">
                        {item.owner?.name || 'Sem dono'}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-base leading-6 text-text-light/75">
                        {item.kind === 'company' &&
                        item.isTrial &&
                        item.trialEndsAt ? (
                          <>
                            <span>
                              Trial até {formatDate(item.trialEndsAt)}
                            </span>
                            <span aria-hidden>·</span>
                          </>
                        ) : null}
                        <span>
                          Acesso {formatDateTime(item.owner?.lastLoginAt)}
                        </span>
                      </div>
                    </div>
                    <MdOutlineChevronRight
                      size={26}
                      className="shrink-0 text-text-light/35"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <SortSheet
        isOpen={sortOpen}
        value={sort}
        options={SORT_OPTIONS}
        onChange={setSort}
        onClose={() => setSortOpen(false)}
      />
    </AppLayout>
  );
}

function PartnerStatusPill({ status }: { status: PartnerStatus }) {
  const styles: Record<PartnerStatus, string> = {
    active: 'bg-accent-green/20 text-accent-green',
    onboarding: 'bg-accent-blue/20 text-accent-blue-soft',
    inactive: 'bg-text-light/10 text-text-light/55',
    expired: 'bg-warning-500/20 text-warning-500',
  };
  const labels: Record<PartnerStatus, string> = {
    active: 'Ativo',
    onboarding: 'Onboarding',
    inactive: 'Inativo',
    expired: 'Expirado',
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
