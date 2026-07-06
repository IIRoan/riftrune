export type BottomSheetMountState = {
  open: boolean;
  mounted: boolean;
};

/** Portal is stuck when parent expects the sheet open but content was unmounted. */
export function isBottomSheetStuck(state: BottomSheetMountState): boolean {
  return state.open && !state.mounted;
}

/** Opening always keeps the portal mounted. */
export function applyOpenToMountState(
  state: BottomSheetMountState
): BottomSheetMountState {
  if (state.open) {
    return { ...state, mounted: true };
  }
  return state;
}

/** Parent closed the sheet — portal can unmount. */
export function applyClosedToMountState(
  state: BottomSheetMountState
): BottomSheetMountState {
  if (!state.open) {
    return { ...state, mounted: false };
  }
  return state;
}

/** Gorhom reports a snap index change; dismiss only notifies the parent. */
export function onSheetIndexChange(
  index: number,
  notifyClosed: () => void
): void {
  if (index === -1) {
    notifyClosed();
  }
}

/**
 * Legacy behavior: unmount portal immediately on swipe dismiss while `open` is still true.
 * Leaves the sheet unable to reopen until `open` toggles false → true again.
 */
export function simulateBuggyDismissBeforeParentUpdates(
  state: BottomSheetMountState
): BottomSheetMountState {
  if (!state.open) {
    return state;
  }
  return { open: true, mounted: false };
}

/** Run open → swipe dismiss → parent close → reopen cycles. */
export function simulateDismissCycle(
  state: BottomSheetMountState,
  dismissMode: 'buggy' | 'fixed'
): BottomSheetMountState {
  let next = applyOpenToMountState({ ...state, open: true });
  if (dismissMode === 'buggy') {
    next = simulateBuggyDismissBeforeParentUpdates(next);
    return next;
  }
  onSheetIndexChange(-1, () => {
    next = applyClosedToMountState({ ...next, open: false });
  });
  return applyOpenToMountState({ ...next, open: true });
}
