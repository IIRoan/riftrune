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

/**
 * Catalog card drawer session (inline Gorhom host — no app Portal).
 *
 * Parent mount-gates on selection. Dismiss clears selection at close-start so
 * the host unmounts immediately and catalog taps work again. Phone tiles do
 * not show selection chrome (avoids a lingering “stuck” border after close).
 */
export type CatalogDrawerSession = {
  selectedVariant: string | null;
  /** Drawer React tree is mounted (Modal/fixed overlay in the tree). */
  hostMounted: boolean;
};

export function isCatalogDrawerGlitched(session: CatalogDrawerSession): boolean {
  return session.selectedVariant != null && !session.hostMounted;
}

export function isCatalogDrawerIdle(session: CatalogDrawerSession): boolean {
  return session.selectedVariant == null && !session.hostMounted;
}

export function openCatalogDrawer(
  _session: CatalogDrawerSession,
  variant: string
): CatalogDrawerSession {
  return { selectedVariant: variant, hostMounted: true };
}

/** Fixed close: clear selection and unmount host together — no linger. */
export function closeCatalogDrawer(_session: CatalogDrawerSession): CatalogDrawerSession {
  return { selectedVariant: null, hostMounted: false };
}

/**
 * Legacy Gorhom path: wait for close animation, then clear selection.
 * Selection border stays up for the whole settle — the downtime users hit.
 */
export function closeCatalogDrawerAfterAnimation(
  _session: CatalogDrawerSession
): CatalogDrawerSession {
  return { selectedVariant: null, hostMounted: false };
}

/** Mid-close: animation running, app state not cleared yet. */
export function catalogDrawerClosingButSelectionHeld(
  session: CatalogDrawerSession
): CatalogDrawerSession {
  return { selectedVariant: session.selectedVariant, hostMounted: true };
}

/**
 * Legacy: sheet dismissed visually but selection (border) stayed until a delayed
 * portal teardown finished — clicks in between set a new selection with no host.
 */
export function closeCatalogDrawerLeavingSelection(
  session: CatalogDrawerSession
): CatalogDrawerSession {
  return { selectedVariant: session.selectedVariant, hostMounted: false };
}

/**
 * Legacy delayed host: selection cleared but an invisible host still blocked taps,
 * so the next select updated the border without a working drawer.
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
 * User starts dismiss (pan threshold / backdrop) — must clear in the same turn,
 * not after a sheet onClose animation.
 */
export function beginCatalogDrawerDismiss(
  _session: CatalogDrawerSession
): CatalogDrawerSession {
  return closeCatalogDrawer(_session);
}

export function simulateQuickReopen(
  session: CatalogDrawerSession,
  nextVariant: string,
  mode: 'fixed' | 'leave-selection' | 'leave-host' | 'wait-for-animation'
): CatalogDrawerSession {
  if (mode === 'wait-for-animation') {
    // Close animation still running: selection held. A tap mid-close races.
    const mid = catalogDrawerClosingButSelectionHeld(session);
    const raced = selectCatalogCard(mid, nextVariant);
    // After animation finally clears, fixed path would recover — but mid-race is bad.
    if (isCatalogDrawerGlitched(raced) || raced.selectedVariant === nextVariant) {
      return raced;
    }
    return selectCatalogCard(closeCatalogDrawerAfterAnimation(session), nextVariant);
  }
  const closed =
    mode === 'fixed'
      ? beginCatalogDrawerDismiss(session)
      : mode === 'leave-selection'
        ? closeCatalogDrawerLeavingSelection(session)
        : closeCatalogDrawerLeavingHost(session);
  return selectCatalogCard(closed, nextVariant);
}
