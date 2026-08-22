const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Compact local timestamp for collection activity lines (22 Aug 15:04). */
export function formatCollectionAddAt(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const month = MONTHS[date.getMonth()] ?? 'Jan';
  const day = date.getDate();
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  if (date.getFullYear() === now.getFullYear()) {
    return `${String(day)} ${month} ${time}`;
  }
  return `${String(day)} ${month} ${String(date.getFullYear() % 100).padStart(2, '0')} ${time}`;
}

export function collectionAddActorLabel(
  name: string | null | undefined
): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first : null;
}

export function formatCollectionLogDelta(quantityDelta: number): string {
  const abs = Math.abs(quantityDelta);
  return quantityDelta > 0 ? `+${String(abs)}` : `−${String(abs)}`;
}

export function formatCollectionLogWhat(
  quantityDelta: number,
  quantityAfter: number | null,
  actorName?: string | null,
  isFoil?: boolean | null
): string {
  const count = Math.abs(quantityDelta);
  const copies = count === 1 ? 'copy' : 'copies';
  const finish = isFoil == null ? '' : isFoil ? ' Foil' : ' Standard';
  let verb: string;
  if (quantityDelta > 0) {
    verb = `Added ${String(count)}${finish} ${copies}`;
  } else if (quantityAfter === 0) {
    verb =
      count === 1
        ? `Removed last${finish} copy`
        : `Removed last ${String(count)}${finish} copies`;
  } else {
    verb = `Removed ${String(count)}${finish} ${copies}`;
  }
  if (quantityAfter != null && quantityAfter > 0) {
    verb = `${verb} · now ${String(quantityAfter)}`;
  }
  const actor = collectionAddActorLabel(actorName);
  return actor ? `${actor} ${verb.charAt(0).toLowerCase()}${verb.slice(1)}` : verb;
}
