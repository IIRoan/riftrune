import type { DeckValidationMessage } from '@/lib/deck-types';

export function deckValidationHeadline(messages: DeckValidationMessage[]): {
  status: 'valid' | 'warning' | 'error';
  label: string;
} {
  const errors = messages.filter((m) => m.type === 'error');
  const warnings = messages.filter((m) => m.type === 'warning');
  if (errors.length > 0) {
    return {
      status: 'error',
      label: errors.length === 1 ? '1 issue' : `${errors.length} issues`,
    };
  }
  if (warnings.length > 0) {
    return {
      status: 'warning',
      label: warnings.length === 1 ? '1 warning' : `${warnings.length} warnings`,
    };
  }
  return { status: 'valid', label: 'Valid' };
}
