import { describe, expect, test } from 'bun:test';
import {
  applyClosedToMountState,
  applyOpenToMountState,
  isBottomSheetStuck,
  onSheetIndexChange,
  simulateBuggyDismissBeforeParentUpdates,
  simulateDismissCycle,
  type BottomSheetMountState,
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
