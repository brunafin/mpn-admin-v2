const STORAGE_KEY = 'mpn-admin.week-city';

export type WeekCity = {
  city: string;
  uf: string;
};

export function weekCityKey(city: WeekCity | null): string {
  if (!city?.city) return '';
  return `${city.city}|${city.uf || ''}`;
}

export function parseWeekCityKey(value: string): WeekCity | null {
  const [city, uf = ''] = value.split('|');
  const name = city?.trim();
  if (!name) return null;
  return { city: name, uf: uf.trim().toUpperCase() };
}

export function readWeekCity(): WeekCity | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WeekCity>;
    if (!parsed.city?.trim()) return null;
    return {
      city: parsed.city.trim(),
      uf: (parsed.uf || '').trim().toUpperCase(),
    };
  } catch {
    return null;
  }
}

export function writeWeekCity(value: WeekCity | null) {
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
