/**
 * Mensalidade = base + (quadras extras × preço por quadra).
 * A 1ª quadra entra na base; a partir da 2ª cobra pricePerCourt.
 */
export function computeMonthlyFee(params: {
  basePrice: number;
  pricePerCourt: number;
  courtsCount: number;
  isTrial?: boolean;
}): number {
  if (params.isTrial) return 0;
  const extraCourts = Math.max(0, params.courtsCount - 1);
  return Number(
    (params.basePrice + params.pricePerCourt * extraCourts).toFixed(2),
  );
}
