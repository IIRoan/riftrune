const SHELL_MAX_WIDTH = 860;
const MODAL_BREAKPOINT = 640;
const OVERLAY_PAD_X_WIDE = 80;
const OVERLAY_PAD_X_NARROW = 32;

export function getModalShellWidth(windowWidth: number): number {
  if (windowWidth < MODAL_BREAKPOINT) {
    return Math.min(windowWidth - OVERLAY_PAD_X_NARROW, 420);
  }
  return Math.min(SHELL_MAX_WIDTH, windowWidth - OVERLAY_PAD_X_WIDE);
}
