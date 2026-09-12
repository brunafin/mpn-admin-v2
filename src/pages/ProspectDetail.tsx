import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { MdArrowBack, MdOpenInNew } from 'react-icons/md';
import {
  COMPETITOR_LABEL,
  getProspect,
  OUTREACH_LABEL,
  updateProspect,
  type CourtCompetitor,
  type GoogleCourtProspect,
  type OutreachStatus,
} from '../api/prospects';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { OutreachBadge } from '../components/Badge';
import Button from '../components/Button';
import Card, { CardLabel } from '../components/Card';
import Select from '../components/Select';
import { ClientDetailSkeleton } from '../components/Skeleton';
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

export default function ProspectDetailPage() {
  const { googlePlaceId } = useParams<{ googlePlaceId: string }>();
  const placeId = googlePlaceId ? decodeURIComponent(googlePlaceId) : '';
  const [prospect, setProspect] = useState<GoogleCourtProspect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<OutreachStatus>('new');
  const [competitor, setCompetitor] = useState<CourtCompetitor>('unknown');
  const [notes, setNotes] = useState('');
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
        setNotes(data.notes || '');
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
    setNotes(data.notes || '');
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!placeId) return;
    setSaving(true);
    setFormError('');
    setSavedHint('');
    try {
      const data = await updateProspect(placeId, {
        outreachStatus: status,
        competitor,
        notes,
      });
      applyProspect(data);
      setSavedHint('Salvo.');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  };

  const onWhatsApp = async () => {
    if (!placeId || !prospect) return;
    try {
      const data = await updateProspect(placeId, { markContacted: true });
      applyProspect(data);
    } catch {
      // Abre o WhatsApp mesmo se o registro de contato falhar.
    }
  };

  const wpp = prospect
    ? whatsappUrlWithText(
        prospect.phone,
        prospectOutreachMessage(prospect.name),
      )
    : null;

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-2 py-1.5 lg:px-6">
          <Link
            to="/prospectos"
            aria-label="Voltar para prospectos"
            className="mpn-tap flex size-9 items-center justify-center rounded-md text-fg hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <MdArrowBack size={20} aria-hidden />
          </Link>
          <h1 className="min-w-0 truncate text-sm font-medium text-fg">
            {prospect?.name || 'Prospecto'}
          </h1>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {loading && !prospect ? <ClientDetailSkeleton /> : null}

          {prospect ? (
            <div className="space-y-4">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-fg">
                      {prospect.name}
                    </p>
                    <p className="mt-1 text-sm text-fg-muted">
                      {[prospect.city, prospect.uf].filter(Boolean).join('/')}
                    </p>
                  </div>
                  <OutreachBadge status={prospect.outreachStatus} />
                </div>
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
                      className="underline-offset-2 hover:underline"
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
                      onClick={() => {
                        void onWhatsApp();
                      }}
                      className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-medium text-white hover:bg-fg/90"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <p className="text-sm text-fg-muted">
                      Sem telefone no Google.
                    </p>
                  )}
                  {prospect.googleMapsUri ? (
                    <a
                      href={prospect.googleMapsUri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg hover:bg-canvas"
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
                      className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg hover:bg-canvas"
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
              </Card>

              <Card aria-labelledby="contato-heading">
                <form onSubmit={onSave}>
                <CardLabel id="contato-heading">Acompanhamento</CardLabel>
                <div className="mt-3">
                  <Select
                    name="outreachStatus"
                    title="Status"
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={(event) =>
                      setStatus(event.target.value as OutreachStatus)
                    }
                  />
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
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-fg"
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
              </Card>
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
