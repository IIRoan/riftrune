import MarkdownIt from 'markdown-it';

/** Soft cap so pathological markdown cannot exhaust the parser/UI. */
export const MAX_MARKDOWN_LENGTH = 12_000;

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Allow only absolute http(s)/mailto URLs. Rejects javascript:, data:,
 * protocol-relative (`//…`), and relative paths.
 */
export function isSafeMarkdownUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('//')) return false;

  try {
    const url = new URL(trimmed);
    return SAFE_URL_PROTOCOLS.has(url.protocol.toLowerCase());
  } catch {
    return false;
  }
}

export function clampMarkdownSource(source: string): string {
  if (source.length <= MAX_MARKDOWN_LENGTH) return source;
  return source.slice(0, MAX_MARKDOWN_LENGTH);
}

/**
 * Soften common authoring mistakes before parse.
 * CommonMark requires a space after `#` for headings (`# Title`);
 * users often write `#Title` — normalize that so preview matches intent.
 */
export function normalizeMarkdownSource(source: string): string {
  return source.replace(/^(#{1,6})([^\s#].*)$/gm, '$1 $2');
}

/** Shared markdown-it instance: no HTML, no images, links validated. */
export function createSafeMarkdownIt(): MarkdownIt {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    // Single newlines → soft breaks so short deck notes read naturally.
    breaks: true,
  });

  md.disable('image');

  const defaultValidate = md.validateLink.bind(md);
  md.validateLink = (url) => defaultValidate(url) && isSafeMarkdownUrl(url);

  return md;
}

const sharedMarkdownIt = createSafeMarkdownIt();

export function getSafeMarkdownIt(): MarkdownIt {
  return sharedMarkdownIt;
}

/** Clamp + normalize source for rendering. */
export function prepareMarkdownSource(source: string): string {
  return normalizeMarkdownSource(clampMarkdownSource(source));
}
