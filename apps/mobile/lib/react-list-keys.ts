/** Stable slug for React list keys — truncates and normalizes text. */
export function keySlug(text: string, maxLen = 48): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) return '_';
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen)}…`;
}

/** Short hash when node content alone is not unique enough. */
export function keyHash(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
