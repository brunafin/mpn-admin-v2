import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { MdArrowBack, MdOpenInNew } from 'react-icons/md';
import {
  COMPETITOR_LABEL,
  getProspect,
  LOST_REASON_LABEL,
  OUTREACH_LABEL,
  PLACE_KIND_LABEL,
  updateProspect,
  type CourtCompetitor,
  type GoogleCourtProspect,
  type LostReason,
  type OutreachStatus,
  type PlaceKind,
} from '../api/prospects';
import AppLayout, { BACK_BAR, BACK_TITLE, PAGE_SHELL } from '../components/AppLayout';
import { OutreachBadge } from '../components/Badge';
import Button, { buttonClassName } from '../components/Button';
import { CardLabel } from '../components/Card';
import Input, { fieldOutlineBase } from '../components/Input';
import RadioGroup from '../components/RadioGroup';
import Select from '../components/Select';
import { ClientDetailSkeleton } from '../components/Skeleton';
import { UF_OPTIONS } from '../constants/ufs';
import { parseCityUfFromAddress, samePlaceName } from '../utils/addressCity';
import { formatDateTime, formatPhone } from '../utils/format';
import {
  prospectOutreachMessage,
  whatsappUrlWithText,
} from '../utils/whatsapp';

const STATUS_OPTIONS = (Object.keys(OUTREACH_LABEL) as OutreachStatus[]).map(
  (id) => ({ id, name: OUTREACH_LABEL[id] }),
);

const COMPETITOR_OPTIONS = (
  Object.keys(COMPETITOR_LABEL) as CourtCompetitor[]
).map((id) => ({ id, name: COMPETITOR_LABEL[id] }));

const PLACE_KIND_OPTIONS = [
  { id: '', name: 'Ainda não sei' },
  ...(Object.keys(PLACE_KIND_LABEL) as PlaceKind[]).map((id) => ({
    id,
    name: PLACE_KIND_LABEL[id],
  })),
];

const LOST_REASON_OPTIONS = (Object.keys(LOST_REASON_LABEL) as LostReason[]).map(
  (value) => ({ value, label: LOST_REASON_LABEL[value] }),
);

export default function ProspectDetailPage() {
  const { googlePlaceId } = useParams<{ googlePlaceId: string }>();
  const [searchParams] = useSearchParams();
  const fromQueue = searchParams.get('from') === 'abordar';
  const placeId = googlePlaceId ? decodeURIComponent(googlePlaceId) : '';
  const [prospect, setProspect] = useState<GoogleCourtProspect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<OutreachStatus>('new');
  const [competitor, setCompetitor] = useState<CourtCompetitor>('unknown');
  const [placeKind, setPlaceKind] = useState<PlaceKind | ''>('');
  const [nextActionOn, setNextActionOn] = useState('');
  const [lostReason, setLostReason] = useState<LostReason | ''>('');
  const [rentsHourly, setRentsHourly] = useState<'yes' | 'no' | 'unknown'>(
    'unknown',
  );
  const [notes, setNotes] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [savedHint, setSavedHint] = useState('');

  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getProspect(placeId)
      .then((data) => {
        if (cancelled) return;
        setProspect(data);
        setStatus(data.outreachStatus);
        setCompetitor(data.competitor);
        setPlaceKind(data.placeKind || '');
        setNextActionOn(data.nextActionOn || '');
        setLostReason(data.lostReason || '');
        setRentsHourly(
          data.rentsHourly === true
            ? 'yes'
            : data.rentsHourly === false
              ? 'no'
              : 'unknown',
        );
        setNotes(data.notes || '');
        setCity(data.city || '');
        setUf(data.uf || '');
      })
      .catch(() => {
        if (!cancelled) setError('Prospecto não encontrado.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const applyProspect = (data: GoogleCourtProspect) => {
    setProspect(data);
    setStatus(data.outreachStatus);
    setCompetitor(data.competitor);
    setPlaceKind(data.placeKind || '');
    setNextActionOn(data.nextActionOn || '');
    setLostReason(data.lostReason || '');
    setRentsHourly(
      data.rentsHourly === true
        ? 'yes'
        : data.rentsHourly === false
          ? 'no'
          : 'unknown',
    );
    setNotes(data.notes || '');
    setCity(data.city || '');
    setUf(data.uf || '');
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!placeId) return;
    if (status === 'lost' && !lostReason) {
      setFormError('Informe o motivo de sem interesse.');
      setSavedHint('');
      return;
    }
    setSaving(true);
    setFormError('');
    setSavedHint('');
    try {
      const data = await updateProspect(placeId, payloadFromForm());
      applyProspect(data);
      setSavedHint('Salvo.');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  };

  const payloadFromForm = () => ({
    outreachStatus: status,
    competitor,
    placeKind: placeKind || null,
    nextActionOn: nextActionOn || null,
    rentsHourly:
      status === 'lost' && lostReason === 'no_hourly'
        ? false
        : rentsHourly === 'yes'
          ? true
          : rentsHourly === 'no'
            ? false
            : null,
    lostReason: status === 'lost' ? lostReason || null : null,
    notes,
    city,
    ...(uf.trim().length === 2 ? { uf: uf.trim().toUpperCase() } : {}),
  });

  const onWhatsApp = async () => {
    if (!placeId || !prospect) return;
    if (status === 'lost' && !lostReason) return;
    try {
      const data = await updateProspect(placeId, {
        ...payloadFromForm(),
        markContacted: true,
      });
      applyProspect(data);
    } catch {
      // Abre o WhatsApp mesmo se o registro de contato falhar.
    }
  };

  const outreachText = prospect
    ? prospectOutreachMessage({
        name: prospect.name,
        placeKind: placeKind || null,
        competitor,
      })
    : null;
  const wpp =
    prospect && outreachText
      ? whatsappUrlWithText(prospect.phone, outreachText)
      : null;
  const addressCity = parseCityUfFromAddress(prospect?.fullAddress);
  const addressDiffers = Boolean(
    addressCity.city &&
      (!samePlaceName(addressCity.city, city) ||
        (addressCity.uf || '') !== uf.toUpperCase()),
  );

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <div className={BACK_BAR}>
          <Link
            to={fromQueue ? '/prospectos?fila=abordar' : '/prospectos'}
            aria-label={
              fromQueue ? 'Voltar para a fila' : 'Voltar para prospectos'
            }
            className="mpn-tap flex size-9 items-center justify-center rounded-md text-fg hover:bg-arena-hover"
          >
            <MdArrowBack size={20} aria-hidden />
          </Link>
          <h1 className={BACK_TITLE}>{prospect?.name || 'Prospecto'}</h1>
          {prospect ? <OutreachBadge status={prospect.outreachStatus} /> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {loading && !prospect ? <ClientDetailSkeleton /> : null}

          {prospect ? (
            <>
                <p className="text-sm text-fg-muted">
                  {[prospect.city, prospect.uf].filter(Boolean).join('/') || '—'}
                </p>
                {prospect.fullAddress ? (
                  <p className="mt-3 text-sm text-fg-muted">
                    {prospect.fullAddress}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-fg">
                  {formatPhone(prospect.phone)}
                </p>
                {prospect.rating != null ? (
                  <p className="mt-1 text-xs text-fg-muted">
                    {prospect.rating.toFixed(1)} no Google
                    {prospect.userRatingsTotal
                      ? ` · ${prospect.userRatingsTotal} avaliações`
                      : ''}
                  </p>
                ) : null}
                {prospect.alreadyRegistered && prospect.matchedCompanyPublicId ? (
                  <p className="mt-3 text-sm text-fg">
                    Já é cliente.{' '}
                    <Link
                      to={`/clientes/${prospect.matchedCompanyPublicId}`}
                      className={buttonClassName({
                        variant: 'ghost',
                        size: 'sm',
                        className: 'h-8 px-2',
                      })}
                    >
                      Abrir cadastro
                    </Link>
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {wpp ? (
                    <a
                      href={wpp}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => {
                        if (status === 'lost' && !lostReason) {
                          event.preventDefault();
                          setFormError('Informe o motivo de sem interesse.');
                          return;
                        }
                        void onWhatsApp();
                      }}
                      className={buttonClassName({ variant: 'primary', size: 'sm' })}
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <p className="text-sm text-fg-muted">
                      {placeKind === 'closed'
                        ? 'Fechou. Fora da fila de abordagem.'
                        : 'Sem telefone no Google.'}
                    </p>
                  )}
                  {prospect.googleMapsUri ? (
                    <a
                      href={prospect.googleMapsUri}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                    >
                      Maps
                      <MdOpenInNew size={14} aria-hidden />
                    </a>
                  ) : null}
                  {prospect.website ? (
                    <a
                      href={prospect.website}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                    >
                      Site
                      <MdOpenInNew size={14} aria-hidden />
                    </a>
                  ) : null}
                </div>
                {prospect.contactedAt ? (
                  <p className="mt-3 text-xs text-fg-muted">
                    Último contato {formatDateTime(prospect.contactedAt)}
                  </p>
                ) : null}

                <form onSubmit={onSave} className="mt-6" aria-labelledby="contato-heading">
                <CardLabel id="contato-heading">Acompanhamento</CardLabel>
                <div className="mt-3">
                  <Input
                    name="city"
                    title="Cidade"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    autoComplete="address-level2"
                  />
                  <Select
                    name="uf"
                    title="UF"
                    value={uf}
                    options={UF_OPTIONS}
                    onChange={(event) => setUf(event.target.value)}
                  />
                  {addressCity && addressDiffers ? (
                    <>
                      <p className="mb-1 text-sm text-fg-muted">
                        O endereço indica {addressCity.city}
                        {addressCity.uf ? `/${addressCity.uf}` : ''}.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mb-3 h-8 px-2"
                        onClick={() => {
                          if (addressCity.city) setCity(addressCity.city);
                          if (addressCity.uf) setUf(addressCity.uf);
                        }}
                      >
                        Usar essa cidade
                      </Button>
                    </>
                  ) : null}
                  <Select
                    name="placeKind"
                    title="Tipo"
                    value={placeKind}
                    omitPlaceholder
                    options={PLACE_KIND_OPTIONS}
                    onChange={(event) =>
                      setPlaceKind(event.target.value as PlaceKind | '')
                    }
                  />
                  <RadioGroup
                    name="rentsHourly"
                    legend="Aluga hora"
                    className="mb-3"
                    value={rentsHourly}
                    options={[
                      { value: 'yes', label: 'Sim' },
                      { value: 'no', label: 'Não' },
                      { value: 'unknown', label: 'Ainda não sei' },
                    ]}
                    onChange={(event) =>
                      setRentsHourly(
                        event.target.value as 'yes' | 'no' | 'unknown',
                      )
                    }
                  />
                  <Input
                    name="nextActionOn"
                    title="Próxima ação"
                    type="date"
                    value={nextActionOn}
                    onChange={(event) => setNextActionOn(event.target.value)}
                  />
                  <Select
                    name="outreachStatus"
                    title="Status"
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={(event) =>
                      setStatus(event.target.value as OutreachStatus)
                    }
                  />
                  {status === 'lost' ? (
                    <RadioGroup
                      name="lostReason"
                      legend="Motivo"
                      required
                      className="mb-3"
                      value={lostReason}
                      options={LOST_REASON_OPTIONS}
                      onChange={(event) =>
                        setLostReason(event.target.value as LostReason)
                      }
                    />
                  ) : null}
                  <Select
                    name="competitor"
                    title="Agenda atual"
                    value={competitor}
                    options={COMPETITOR_OPTIONS}
                    onChange={(event) =>
                      setCompetitor(event.target.value as CourtCompetitor)
                    }
                  />
                  <label className="mb-3 flex flex-col">
                    <span className="mb-1.5 text-sm font-medium text-fg">
                      Notas
                    </span>
                    <textarea
                      name="notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={4}
                      className={`${fieldOutlineBase} w-full py-2`}
                      placeholder="Quem atendeu, o que falou, próximo passo…"
                    />
                  </label>
                </div>
                {formError ? (
                  <p className="mb-3 text-sm font-medium text-danger" role="alert">
                    {formError}
                  </p>
                ) : null}
                {savedHint ? (
                  <p className="mb-3 text-sm text-fg-muted">{savedHint}</p>
                ) : null}
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </Button>
                </form>
            </>
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
