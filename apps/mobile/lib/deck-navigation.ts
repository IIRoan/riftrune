import type { Router } from 'expo-router';

/** Leave the deck-add picker and land on the deck editor (never a random prior tab). */
export function leaveDeckAddScreen(router: Router, deckId: string) {
  router.dismissTo(deckEditHref(deckId));
}

/**
 * Leave edit mode and land on the deck viewer.
 * Edit is pushed on top of the viewer, so dismiss pops with the reverse slide
 * (replace would animate forward — the wrong direction).
 */
export function leaveDeckEditMode(router: Router, deckId: string) {
  if (router.canDismiss()) {
    router.dismiss(1);
    return;
  }
  router.replace(deckViewHref(deckId));
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

/** After creating a deck, land in the editor with the viewer under it so back pops correctly. */
export function enterCreatedDeckEditor(router: Router, deckId: string) {
  router.replace(deckViewHref(deckId));
  router.push(deckEditHref(deckId));
}
