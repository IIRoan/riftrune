import type { Router } from 'expo-router';

/** Leave the deck-add picker and land on the deck editor (never a random prior tab). */
export function leaveDeckAddScreen(router: Router, deckId: string) {
  router.dismissTo(`/decks/${deckId}`);
}

/** Leave the deck editor and land on My decks. */
export function leaveDeckEditor(router: Router) {
  router.dismissTo('/decks');
}
