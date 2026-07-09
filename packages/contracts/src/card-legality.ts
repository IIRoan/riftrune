/** True when a card's tournament ban date exists and is on or before `nowMs`. */
export function isCardBannedAt(
  banEffectiveDate: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!banEffectiveDate) return false;
  const parsed = Date.parse(banEffectiveDate);
  return Number.isFinite(parsed) && parsed <= nowMs;
}

export function isCardNameInBannedList(
  name: string,
  bannedCardNames?: readonly string[]
): boolean {
  if (!bannedCardNames?.length) return false;
  const needle = name.trim().toLowerCase();
  return bannedCardNames.some((entry) => entry.trim().toLowerCase() === needle);
}
