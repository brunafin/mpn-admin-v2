import api from './axios';

export type OutreachStatus =
  | 'new'
  | 'contacted'
  | 'waiting'
  | 'interested'
  | 'won'
  | 'lost'
  | 'competitor'
  | 'skip';

export type CourtCompetitor =
  | 'unknown'
  | 'none'
  | 'webquadras'
  | 'agendei'
  | 'own_site'
  | 'other';

export type GoogleCourtProspect = {
  googlePlaceId: string;
  name: string;
  phone: string | null;
  fullAddress: string | null;
  city: string | null;
  uf: string | null;
  website: string | null;
  googleMapsUri: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  competitor: CourtCompetitor;
  outreachStatus: OutreachStatus;
  notes: string | null;
  contactedAt: string | null;
  alreadyRegistered: boolean;
  matchedCompanyPublicId: string | null;
  lastCheckedAt: string | null;
};

export type GoogleCourtListResponse = {
  items: GoogleCourtProspect[];
  total: number;
  page: number;
  limit: number;
  counts: Record<OutreachStatus, number>;
};

export type ProspectCity = {
  city: string;
  uf: string | null;
  count: number;
};

export type SearchProspectsPayload = {
  city: string;
  uf: string;
  queries?: string[];
};

export type GoogleCourtSearchHit = {
  googlePlaceId: string;
  name: string;
  phone: string | null;
  fullAddress: string | null;
  city: string | null;
  uf: string | null;
  website: string | null;
  googleMapsUri: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  latitude: number | null;
  longitude: number | null;
  competitor: CourtCompetitor;
  inPortfolio: boolean;
  outreachStatus: OutreachStatus | null;
  alreadyRegistered: boolean;
  matchedCompanyPublicId: string | null;
};

export type SearchProspectsResult = {
  city: string;
  uf: string;
  found: number;
  skipped: number;
  alreadyInPortfolio: number;
  items: GoogleCourtSearchHit[];
};

export type ImportProspectsPayload = {
  city: string;
  uf: string;
  places: Array<{
    googlePlaceId: string;
    name: string;
    phone?: string | null;
    fullAddress?: string | null;
    website?: string | null;
    googleMapsUri?: string | null;
    rating?: number | null;
    userRatingsTotal?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  }>;
};

export type ImportProspectsResult = {
  city: string;
  uf: string;
  imported: number;
  updated: number;
  items: GoogleCourtProspect[];
};

export const OUTREACH_LABEL: Record<OutreachStatus, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  waiting: 'Aguardando',
  interested: 'Interessado',
  won: 'Cliente',
  lost: 'Sem interesse',
  competitor: 'Concorrente',
  skip: 'Ignorar',
};

export const COMPETITOR_LABEL: Record<CourtCompetitor, string> = {
  unknown: 'Não sei',
  none: 'Sem agenda online',
  webquadras: 'WebQuadras',
  agendei: 'Agendei',
  own_site: 'Site próprio',
  other: 'Outro',
};

export function listProspects(params: {
  q?: string;
  city?: string;
  uf?: string;
  status?: OutreachStatus | '';
  competitor?: CourtCompetitor | '';
  page?: number;
  limit?: number;
}) {
  const query: Record<string, string | number> = {};
  if (params.q?.trim()) query.q = params.q.trim();
  if (params.city?.trim()) query.city = params.city.trim();
  if (params.uf?.trim()) query.uf = params.uf.trim();
  if (params.status) query.status = params.status;
  if (params.competitor) query.competitor = params.competitor;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return api
    .get<GoogleCourtListResponse>('/google-courts', { params: query })
    .then((res) => res.data);
}

export function listProspectCities() {
  return api.get<ProspectCity[]>('/google-courts/cities').then((res) => res.data);
}

export function getProspect(googlePlaceId: string) {
  return api
    .get<GoogleCourtProspect>(
      `/google-courts/${encodeURIComponent(googlePlaceId)}`,
    )
    .then((res) => res.data);
}

export function updateProspect(
  googlePlaceId: string,
  payload: {
    outreachStatus?: OutreachStatus;
    competitor?: CourtCompetitor;
    notes?: string;
    markContacted?: boolean;
  },
) {
  return api
    .patch<GoogleCourtProspect>(
      `/google-courts/${encodeURIComponent(googlePlaceId)}`,
      payload,
    )
    .then((res) => res.data);
}

export function searchProspects(payload: SearchProspectsPayload) {
  return api
    .post<SearchProspectsResult>('/google-courts/search', payload, {
      timeout: 90_000,
    })
    .then((res) => res.data);
}

export function importProspects(payload: ImportProspectsPayload) {
  return api
    .post<ImportProspectsResult>('/google-courts/import', payload, {
      timeout: 30_000,
    })
    .then((res) => res.data);
}
