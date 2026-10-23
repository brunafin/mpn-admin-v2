/** Mesma leitura do endereço que a API usa ao gravar o prospecto. */
export function parseCityUfFromAddress(
  address: string | null | undefined,
): { city: string | null; uf: string | null } {
  if (!address) return { city: null, uf: null };
  const match = address.match(/,\s*([^,]+?)\s*-\s*([A-Z]{2})(?:\s|,|$)/i);
  if (!match) return { city: null, uf: null };
  return {
    city: match[1].trim(),
    uf: match[2].trim().toUpperCase(),
  };
}

export function samePlaceName(a: string | null | undefined, b: string | null | undefined) {
  const fold = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  return fold(a || '') === fold(b || '');
}
