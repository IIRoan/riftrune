import type { Router } from 'expo-router';

/** Leave the deck-add picker and land on the deck editor (never a random prior tab). */
export function leaveDeckAddScreen(router: Router, deckId: string) {
  router.dismissTo(deckEditHref(deckId));
}

/** Leave the deck editor / viewer and land on My decks. */
export function leaveDeckEditor(router: Router) {
  router.dismissTo('/decks');
}

/** View-only deck profile (gallery, no edit chrome). */
export function deckViewHref(deckId: string): `/decks/${string}` {
  return `/decks/${deckId}`;
}

/** Editable deck builder. */
export function deckEditHref(deckId: string): `/decks/${string}?mode=edit` {
  return `/decks/${deckId}?mode=edit`;
}

export function isDeckEditMode(mode: string | string[] | undefined): boolean {
  const value = Array.isArray(mode) ? mode[0] : mode;
  return value === 'edit';
}
