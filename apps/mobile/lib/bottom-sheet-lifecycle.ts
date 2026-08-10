/**
 * Catalog card drawer session — Gorhom sheet with immediate dismiss.
 *
 * Parent mount-gates on selection. Dismiss clears selection as soon as the
 * close commits (not after the spring) so nothing stays mounted and blocking
 * catalog taps.
 */
export type CatalogDrawerSession = {
  selectedVariant: string | null;
  /** Drawer React tree is mounted. */
  hostMounted: boolean;
};

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

export function isCatalogDrawerGlitched(session: CatalogDrawerSession): boolean {
  return session.selectedVariant != null && !session.hostMounted;
}

export function isCatalogDrawerIdle(session: CatalogDrawerSession): boolean {
  return session.selectedVariant == null && !session.hostMounted;
}

/** Mounted host means the sheet is in the tree (presented or presenting). */
export function isCatalogDrawerBlockingTaps(session: CatalogDrawerSession): boolean {
  return session.hostMounted;
}

export function openCatalogDrawer(
  _session: CatalogDrawerSession,
  variant: string
): CatalogDrawerSession {
  return { selectedVariant: variant, hostMounted: true };
}

/** Dismiss finished: clear selection and unmount host together. */
export function closeCatalogDrawer(_session: CatalogDrawerSession): CatalogDrawerSession {
  return { selectedVariant: null, hostMounted: false };
}

/**
 * Legacy Gorhom path: wait for close animation while host stays mounted.
 * Blocks catalog taps / next open — do not use.
 */
export function closeCatalogDrawerAfterAnimation(
  _session: CatalogDrawerSession
): CatalogDrawerSession {
  return { selectedVariant: null, hostMounted: false };
}

/** Mid-close: animation running, app state not cleared yet (legacy / buggy). */
export function catalogDrawerClosingButSelectionHeld(
  session: CatalogDrawerSession
): CatalogDrawerSession {
  return { selectedVariant: session.selectedVariant, hostMounted: true };
}

/**
 * Legacy: sheet dismissed visually but selection stayed — next select has no host.
 */
export function closeCatalogDrawerLeavingSelection(
  session: CatalogDrawerSession
): CatalogDrawerSession {
  return { selectedVariant: session.selectedVariant, hostMounted: false };
}

/**
 * Legacy: selection cleared but an invisible host still blocked taps.
 */
export function closeCatalogDrawerLeavingHost(
  _session: CatalogDrawerSession
): CatalogDrawerSession {
  return { selectedVariant: null, hostMounted: true };
}

export function selectCatalogCard(
  session: CatalogDrawerSession,
  variant: string
): CatalogDrawerSession {
  if (!session.hostMounted && session.selectedVariant == null) {
    return openCatalogDrawer(session, variant);
  }
  if (session.hostMounted && session.selectedVariant != null) {
    return { selectedVariant: variant, hostMounted: true };
  }
  return { selectedVariant: variant, hostMounted: false };
}

/**
 * Dismiss commit — clear selection in the same turn so the host unmounts and
 * the next card can open a fresh sheet.
 */
export function beginCatalogDrawerDismiss(
  session: CatalogDrawerSession
): CatalogDrawerSession {
  return closeCatalogDrawer(session);
}

/**
 * Stale dismiss from a previous sheet instance must not clear a newer selection
 * (e.g. remount with key=B while A's onDidDismiss still fires).
 */
export function shouldClearSelectionOnDismiss(
  selectedVariant: string | null,
  dismissedVariant: string
): boolean {
  return selectedVariant === dismissedVariant;
}

export function simulateQuickReopen(
  session: CatalogDrawerSession,
  nextVariant: string,
  mode: 'fixed' | 'leave-selection' | 'leave-host' | 'wait-for-animation'
): CatalogDrawerSession {
  if (mode === 'wait-for-animation') {
    const mid = catalogDrawerClosingButSelectionHeld(session);
    return selectCatalogCard(mid, nextVariant);
  }
  if (mode === 'fixed') {
    const closed = beginCatalogDrawerDismiss(session);
    return selectCatalogCard(closed, nextVariant);
  }
  const closed =
    mode === 'leave-selection'
      ? closeCatalogDrawerLeavingSelection(session)
      : closeCatalogDrawerLeavingHost(session);
  return selectCatalogCard(closed, nextVariant);
}
