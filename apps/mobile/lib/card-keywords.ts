const STAT_KEYWORDS = new Set(['might', 'power', 'energy']);

const KEYWORD_BADGE_CLASSES: Record<string, string> = {
  ACTION: 'bg-keyword-accelerate italic',
  ACCELERATE: 'bg-keyword-accelerate italic',
  GANKING: 'bg-keyword-combat italic',
  ASSAULT: 'bg-keyword-combat italic',
  SHIELD: 'bg-keyword-ability italic',
  TANK: 'bg-keyword-ability italic',
  LEGION: 'bg-keyword-ability italic',
  TEMPORARY: 'bg-keyword-default italic',
  SLOW: 'bg-keyword-default italic',
  FAST: 'bg-keyword-default italic',
};

export function isStatKeyword(label: string): boolean {
  return STAT_KEYWORDS.has(label.toLowerCase());
}

export function getKeywordBadgeClassName(label: string): string {
  const key = label.toUpperCase();
  return KEYWORD_BADGE_CLASSES[key] ?? 'bg-keyword-default italic';
}
