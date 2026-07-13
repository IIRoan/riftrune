import { isDomainKeyword, isRuneToken, isStatKeyword, isTapToken, parseKeywordToken } from '@/lib/card-keywords';

export type CardRulesPart =
  | { type: 'text'; value: string }
  | {
      type: 'keyword';
      value: string;
      keywordBase: string;
      display: string;
    }
  | { type: 'stat'; value: string }
  | { type: 'domain'; value: string }
  | { type: 'energy'; value: string }
  | { type: 'might'; value: string }
  | { type: 'tap'; value: string }
  | { type: 'rune'; value: string };

export type InlineTextRunPart =
  | { type: 'text'; value: string }
  | {
      type: 'keyword';
      value: string;
      keywordBase: string;
      display: string;
    }
  | { type: 'energy'; value: string }
  | { type: 'stat'; value: string };

export type InlineSegment =
  | { type: 'text-run'; parts: InlineTextRunPart[] }
  | { type: 'domain'; value: string }
  | { type: 'might'; value: string }
  | { type: 'tap'; value: string }
  | { type: 'rune'; value: string }
  | { type: 'stat'; value: string };

function classifyBracketToken(inner: string): CardRulesPart {
  const trimmed = inner.trim();

  if (/^\d+$/.test(trimmed)) {
    return { type: 'energy', value: trimmed };
  }

  if (isDomainKeyword(trimmed)) {
    return { type: 'domain', value: trimmed };
  }

  if (trimmed.toLowerCase() === 'might') {
    return { type: 'might', value: trimmed };
  }

  if (isTapToken(trimmed)) {
    return { type: 'tap', value: trimmed };
  }

  if (isRuneToken(trimmed)) {
    return { type: 'rune', value: trimmed };
  }

  if (isStatKeyword(trimmed)) {
    return { type: 'stat', value: trimmed };
  }

  const keyword = parseKeywordToken(trimmed);
  if (keyword) {
    return {
      type: 'keyword',
      value: trimmed,
      keywordBase: keyword.base,
      display: keyword.display,
    };
  }

  const fallback = trimmed.toUpperCase();
  return {
    type: 'keyword',
    value: trimmed,
    keywordBase: fallback,
    display: fallback,
  };
}

export function parseCardRules(text: string): CardRulesPart[] {
  const parts: CardRulesPart[] = [];
  const re = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push(classifyBracketToken(match[1]));
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

export function splitRuleParagraphs(text: string): string[] {
  return text.split('\n');
}

export type RulesRenderToken =
  | { kind: 'text' }
  | { kind: 'keyword'; base: string }
  | { kind: 'might' }
  | { kind: 'tap' }
  | { kind: 'rune' }
  | { kind: 'domain'; name: string }
  | { kind: 'energy'; value: string };

export function summarizeRulesRender(text: string): RulesRenderToken[] {
  const tokens: RulesRenderToken[] = [];

  for (const paragraph of splitRuleParagraphs(text)) {
    for (const part of parseCardRules(paragraph)) {
      if (part.type === 'text') {
        tokens.push({ kind: 'text' });
      } else if (part.type === 'keyword') {
        tokens.push({ kind: 'keyword', base: part.keywordBase });
      } else if (part.type === 'energy') {
        tokens.push({ kind: 'energy', value: part.value });
      } else if (part.type === 'might') {
        tokens.push({ kind: 'might' });
      } else if (part.type === 'tap') {
        tokens.push({ kind: 'tap' });
      } else if (part.type === 'rune') {
        tokens.push({ kind: 'rune' });
      } else if (part.type === 'domain') {
        tokens.push({ kind: 'domain', name: part.value });
      }
    }
  }

  return tokens;
}

function isTextRunPart(part: CardRulesPart): part is InlineTextRunPart {
  return (
    part.type === 'text' ||
    part.type === 'keyword' ||
    part.type === 'energy' ||
    part.type === 'stat'
  );
}

/** @deprecated Prefer rendering all parts inside one Text node for inline flow. */
export function groupInlineSegments(parts: CardRulesPart[]): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let run: InlineTextRunPart[] = [];

  const flushRun = () => {
    if (run.length > 0) {
      segments.push({ type: 'text-run', parts: run });
      run = [];
    }
  };

  for (const part of parts) {
    if (isTextRunPart(part)) {
      run.push(part);
      continue;
    }

    flushRun();
    segments.push(part);
  }

  flushRun();
  return segments;
}

export function isInlineIconPart(
  part: CardRulesPart
): part is Extract<CardRulesPart, { type: 'might' | 'tap' | 'rune' | 'domain' }> {
  return part.type === 'might' || part.type === 'tap' || part.type === 'rune' || part.type === 'domain';
}

export type ParagraphSegment =
  | { type: 'text-run'; parts: CardRulesPart[] }
  | { type: 'inline-row'; parts: CardRulesPart[] };

export function groupParagraphSegments(parts: CardRulesPart[]): ParagraphSegment[] {
  const segments: ParagraphSegment[] = [];
  let textRun: CardRulesPart[] = [];
  let index = 0;

  const flushTextRun = () => {
    if (textRun.length > 0) {
      segments.push({ type: 'text-run', parts: textRun });
      textRun = [];
    }
  };

  while (index < parts.length) {
    const part = parts[index]!;

    if (!isInlineIconPart(part)) {
      textRun.push(part);
      index++;
      continue;
    }

    const row: CardRulesPart[] = [...textRun];
    textRun = [];

    while (index < parts.length) {
      if (isInlineIconPart(parts[index]!)) {
        row.push(parts[index]!);
        index++;
        if (index < parts.length && parts[index]!.type === 'text') {
          row.push(parts[index]!);
          index++;
        }
        continue;
      }
      break;
    }

    segments.push({ type: 'inline-row', parts: row });
  }

  flushTextRun();
  return segments;
}
