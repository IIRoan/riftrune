import { describe, expect, test } from 'bun:test';
import {
  applyClosedToMountState,
  applyOpenToMountState,
  beginCatalogDrawerDismiss,
  closeCatalogDrawerLeavingHost,
  closeCatalogDrawerLeavingSelection,
  isBottomSheetStuck,
  isCatalogDrawerBlockingTaps,
  isCatalogDrawerGlitched,
  isCatalogDrawerIdle,
  onSheetIndexChange,
  openCatalogDrawer,
  selectCatalogCard,
  shouldClearSelectionOnDismiss,
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

describe('catalog drawer dismiss', () => {
  const idle: CatalogDrawerSession = {
    selectedVariant: null,
    hostMounted: false,
  };

  test('dismiss clears selection and host so the next card can present', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    expect(isCatalogDrawerBlockingTaps(open)).toBe(true);

    const afterDismiss = beginCatalogDrawerDismiss(open);
    expect(isCatalogDrawerIdle(afterDismiss)).toBe(true);
    expect(isCatalogDrawerBlockingTaps(afterDismiss)).toBe(false);

    const reopened = selectCatalogCard(afterDismiss, 'OGN-002');
    expect(reopened).toEqual({ selectedVariant: 'OGN-002', hostMounted: true });
  });

  test('stale dismiss for a previous variant does not clear the new selection', () => {
    expect(shouldClearSelectionOnDismiss('OGN-002', 'OGN-001')).toBe(false);
    expect(shouldClearSelectionOnDismiss('OGN-001', 'OGN-001')).toBe(true);
    expect(shouldClearSelectionOnDismiss(null, 'OGN-001')).toBe(false);
  });

  test('leaving selection after close reproduces selected-but-no-drawer', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    expect(isCatalogDrawerGlitched(closeCatalogDrawerLeavingSelection(open))).toBe(
      true
    );
  });

  test('leaving a host after close is a stale blocker', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    const blocked = closeCatalogDrawerLeavingHost(open);
    expect(isCatalogDrawerBlockingTaps(blocked)).toBe(true);
    expect(blocked.selectedVariant).toBeNull();
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

  test('legacy leave-selection stays glitched', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    expect(
      isCatalogDrawerGlitched(simulateQuickReopen(open, 'OGN-002', 'leave-selection'))
    ).toBe(true);
  });

  test('delayed host while selection held blocks the next open', () => {
    const open = openCatalogDrawer(idle, 'OGN-001');
    const midClose = {
      selectedVariant: open.selectedVariant,
      hostMounted: true,
    };
    expect(isCatalogDrawerBlockingTaps(midClose)).toBe(true);
    expect(isCatalogDrawerIdle(beginCatalogDrawerDismiss(open))).toBe(true);
  });
});
