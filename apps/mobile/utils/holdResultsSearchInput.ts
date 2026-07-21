export type HoldResultsSearchState = {
  draft: string;
  /** Committed query captured on focus-clear; null when not holding. */
  holdingFrom: string | null;
};

export function createHoldResultsSearchState(committed: string): HoldResultsSearchState {
  return { draft: committed, holdingFrom: null };
}

/** Parent committed value changed (history pick, external clear, etc.). */
export function syncHoldResultsSearchState(
  state: HoldResultsSearchState,
  committed: string
): HoldResultsSearchState {
  if (state.holdingFrom !== null && state.holdingFrom === committed) {
    return state;
  }
  return { draft: committed, holdingFrom: null };
}

export function focusHoldResultsSearchState(
  state: HoldResultsSearchState,
  committed: string
): HoldResultsSearchState {
  if (state.draft.length === 0 && committed.length === 0) {
    return state;
  }
  return { draft: '', holdingFrom: committed };
}

export function blurHoldResultsSearchState(
  state: HoldResultsSearchState
): HoldResultsSearchState {
  if (state.holdingFrom === null) {
    return state;
  }
  if (state.draft.length === 0) {
    return { draft: state.holdingFrom, holdingFrom: null };
  }
  return { ...state, holdingFrom: null };
}

export function changeHoldResultsSearchState(text: string): HoldResultsSearchState {
  return { draft: text, holdingFrom: null };
}

export function clearHoldResultsSearchState(): HoldResultsSearchState {
  return { draft: '', holdingFrom: null };
}
