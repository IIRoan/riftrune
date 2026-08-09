import { describe, expect, test } from 'bun:test';
import {
  applyClosedToMountState,
  applyOpenToMountState,
  beginCatalogDrawerDismiss,
  catalogDrawerClosingButSelectionHeld,
  closeCatalogDrawer,
  closeCatalogDrawerLeavingHost,
  closeCatalogDrawerLeavingSelection,
  isBottomSheetStuck,
  isCatalogDrawerGlitched,
  isCatalogDrawerIdle,
  onSheetIndexChange,
  openCatalogDrawer,
  selectCatalogCard,
  simulateBuggyDismissBeforeParentUpdates,
  simulateDismissCycle,
  simulateQuickReopen,
  type BottomSheetMountState,
  type CatalogDrawerSession,
} from '@/lib/bottom-sheet-lifecycle';

describe('bottom sheet mount lifecycle', () => {
  test('swipe dismiss must not unmount portal while open stays true', () => {
    const afterDismiss = simulateBuggyDismissBeforeParentUpdates({
      open: true,
      mounted: true,
    });
    expect(isBottomSheetStuck(afterDismiss)).toBe(true);
  });

  test('fixed dismiss cycle never leaves the sheet stuck', () => {
    let state: BottomSheetMountState = { open: false, mounted: false };

    for (let i = 0; i < 25; i += 1) {
      state = simulateDismissCycle(state, 'fixed');
      expect(isBottomSheetStuck(state)).toBe(false);
      expect(state.open).toBe(true);
      expect(state.mounted).toBe(true);
    }
  });

  test('repeated buggy dismiss cycles get stuck without an open toggle', () => {
    let state: BottomSheetMountState = { open: false, mounted: false };

    for (let i = 0; i < 3; i += 1) {
      state = simulateDismissCycle(state, 'buggy');
    }

    expect(isBottomSheetStuck(state)).toBe(true);
  });

  test('open prop mounts portal; closed prop unmounts after parent updates', () => {
    expect(applyOpenToMountState({ open: true, mounted: false })).toEqual({
      open: true,
      mounted: true,
    });
    expect(applyClosedToMountState({ open: false, mounted: true })).toEqual({
      open: false,
      mounted: false,
    });
  });

  test('sheet index -1 only notifies close', () => {
    let notified = false;
    onSheetIndexChange(0, () => {
      notified = true;
    });
    expect(notified).toBe(false);

    onSheetIndexChange(-1, () => {
      notified = true;
    });
    expect(notified).toBe(true);
  });
});

describe('catalog drawer mount-gated quick reopen', () => {
  const idle: CatalogDrawerSession = {
    selectedVariant: null,
    hostMounted: false,
  };

  test('dismiss-start clears selection immediately (no post-animation wait)', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    const midClose = catalogDrawerClosingButSelectionHeld(open);
    expect(midClose.selectedVariant).toBe('OGN-001');

    const dismissed = beginCatalogDrawerDismiss(open);
    expect(dismissed.selectedVariant).toBeNull();
    expect(dismissed.hostMounted).toBe(false);
    expect(isCatalogDrawerIdle(dismissed)).toBe(true);
  });

  test('close clears selection and host together so the tile border drops immediately', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    const closed = closeCatalogDrawer(open);

    expect(closed.selectedVariant).toBeNull();
    expect(closed.hostMounted).toBe(false);
    expect(isCatalogDrawerIdle(closed)).toBe(true);
    expect(isCatalogDrawerGlitched(closed)).toBe(false);
  });

  test('leaving selection after close reproduces selected-but-no-drawer', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    const broken = closeCatalogDrawerLeavingSelection(open);
    expect(isCatalogDrawerGlitched(broken)).toBe(true);
  });

  test('leaving an invisible host after close makes the next select glitch', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    const blocked = closeCatalogDrawerLeavingHost(open);
    const glitched = selectCatalogCard(blocked, 'OGN-002');

    expect(glitched.selectedVariant).toBe('OGN-002');
    expect(isCatalogDrawerGlitched(glitched)).toBe(true);
  });

  test('fixed quick reopen never glitches across many cycles', () => {
    let session = idle;

    for (let i = 0; i < 40; i += 1) {
      session = openCatalogDrawer(session, `OGN-${String(i).padStart(3, '0')}`);
      expect(isCatalogDrawerGlitched(session)).toBe(false);
      session = simulateQuickReopen(
        session,
        `OGN-${String(i + 1).padStart(3, '0')}`,
        'fixed'
      );
      expect(isCatalogDrawerGlitched(session)).toBe(false);
      expect(session.hostMounted).toBe(true);
      expect(session.selectedVariant).toBe(`OGN-${String(i + 1).padStart(3, '0')}`);
    }
  });

  test('legacy leave-selection and leave-host reopen paths stay glitched', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    expect(isCatalogDrawerGlitched(simulateQuickReopen(open, 'OGN-002', 'leave-selection'))).toBe(
      true
    );
    expect(isCatalogDrawerGlitched(simulateQuickReopen(open, 'OGN-002', 'leave-host'))).toBe(true);
  });

  test('waiting for close animation before clearing selection is the downtime race', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    const mid = catalogDrawerClosingButSelectionHeld(open);
    // Tap during settle: selection swaps while old host is still closing.
    const raced = selectCatalogCard(mid, 'OGN-002');
    expect(raced.selectedVariant).toBe('OGN-002');
    expect(raced.hostMounted).toBe(true);
  });
});
