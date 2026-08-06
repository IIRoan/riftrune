import { useSyncExternalStore } from 'react';
import type { CatalogFilters } from '@/constants/catalogFilters';

export type DeckBuilderMobileFilterChrome = {
  filters: CatalogFilters;
  onOpen: () => void;
} | null;

let snapshot: DeckBuilderMobileFilterChrome = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function chromeEqual(
  a: DeckBuilderMobileFilterChrome,
  b: DeckBuilderMobileFilterChrome
): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return a.filters === b.filters && a.onOpen === b.onOpen;
}

export function publishDeckBuilderMobileFilterChrome(
  next: DeckBuilderMobileFilterChrome
) {
  if (chromeEqual(snapshot, next)) return;
  snapshot = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

export function useDeckBuilderMobileFilterChrome() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
