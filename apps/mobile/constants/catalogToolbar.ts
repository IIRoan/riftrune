import type { ThemedIconColor } from '@/lib/themeIconTokens';
import { cn } from '@/lib/utils';

/** Icon-only toolbar control — matches Layout.minTouchTarget (44px). */
export const CATALOG_TOOLBAR_CONTROL_CLASS =
  'size-11 items-center justify-center rounded-xl border border-border bg-card active:bg-card-panel';

/** Labeled toolbar control (Sort, Filters) — auto width for text + badge. */
export const CATALOG_TOOLBAR_LABELED_CONTROL_CLASS =
  'h-11 flex-row items-center justify-center rounded-xl border border-border bg-card px-3 active:bg-card-panel';

/** Active toolbar icon button (e.g. filter applied). */
export const CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS = 'border-ring/50 bg-card-panel';

/** Segmented control shell (view toggle). */
export const CATALOG_TOOLBAR_GROUP_CLASS =
  'flex-row items-center rounded-lg border border-border bg-card p-0.5';

/** Single segment inside the view toggle group. */
export const CATALOG_TOOLBAR_SEGMENT_CLASS =
  'size-10 items-center justify-center rounded-md';

export const CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS = 'bg-card-panel';
export const CATALOG_TOOLBAR_SEGMENT_INACTIVE_CLASS = 'active:opacity-70';

/** Mobile toolbar row — leading prefs / trailing tools. */
export const CATALOG_TOOLBAR_MOBILE_ROW_CLASS =
  'w-full flex-row items-center justify-between gap-2';

/** Mobile icon control — 44×44 touch target. */
export const CATALOG_TOOLBAR_CONTROL_CLASS_MOBILE =
  'size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card active:bg-card-panel';

export const CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS_MOBILE = 'border-ring/50 bg-card-panel';

/** Segmented control shell on phone — natural width, matches 44pt row. */
export const CATALOG_TOOLBAR_GROUP_CLASS_MOBILE =
  'h-11 shrink-0 flex-row items-center rounded-xl border border-border bg-card p-0.5';

export const CATALOG_TOOLBAR_SEGMENT_CLASS_MOBILE =
  'h-10 w-10 items-center justify-center rounded-lg';

export const CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS_MOBILE = 'bg-card-panel';

/** Shared bordered input shell — matches catalog toolbar controls. */
export const INPUT_SHELL_CLASS =
  'h-11 min-h-11 rounded-lg border border-border bg-card px-3 py-0 active:bg-card-panel dark:active:bg-card';

/** Search inputs with a leading icon addon. */
export const INPUT_SEARCH_SHELL_CLASS =
  'h-11 min-h-11 rounded-lg border border-border bg-card py-0 pl-0 pr-1 active:bg-card-panel dark:active:bg-card';

/** Multiline input shell. */
export const INPUT_TEXTAREA_SHELL_CLASS =
  'min-h-28 rounded-lg border border-border bg-card px-3 py-2 items-start active:bg-card-panel dark:active:bg-card';

export type ToolbarIconTone = 'active' | 'inactive' | 'primary';

/** Icon color for toolbar controls — foreground when active, muted when idle. */
export function catalogToolbarIconColor(tone: ToolbarIconTone): ThemedIconColor {
  if (tone === 'primary') return 'primary';
  return tone === 'active' ? 'foreground' : 'muted-foreground';
}

export function catalogToolbarGroupClass(mobile = false): string {
  return mobile ? CATALOG_TOOLBAR_GROUP_CLASS_MOBILE : CATALOG_TOOLBAR_GROUP_CLASS;
}

/** Mobile labeled control — compact text + icon (rarely used; prefer icons). */
export const CATALOG_TOOLBAR_LABELED_CONTROL_CLASS_MOBILE =
  'h-11 shrink-0 flex-row items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 active:bg-card-panel';

export function catalogToolbarButtonClasses(
  active = false,
  mobile = false,
  labeled = false
): string {
  if (mobile && labeled) {
    return cn(
      CATALOG_TOOLBAR_LABELED_CONTROL_CLASS_MOBILE,
      active && CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS_MOBILE
    );
  }
  if (mobile) {
    return cn(
      CATALOG_TOOLBAR_CONTROL_CLASS_MOBILE,
      active && CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS_MOBILE
    );
  }
  if (labeled) {
    return cn(
      CATALOG_TOOLBAR_LABELED_CONTROL_CLASS,
      active && CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS
    );
  }
  return cn(
    CATALOG_TOOLBAR_CONTROL_CLASS,
    active && CATALOG_TOOLBAR_CONTROL_ACTIVE_CLASS
  );
}

export function catalogToolbarSegmentClasses(active: boolean, mobile = false): string {
  if (mobile) {
    return cn(
      CATALOG_TOOLBAR_SEGMENT_CLASS_MOBILE,
      active
        ? CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS_MOBILE
        : CATALOG_TOOLBAR_SEGMENT_INACTIVE_CLASS
    );
  }
  return cn(
    CATALOG_TOOLBAR_SEGMENT_CLASS,
    active ? CATALOG_TOOLBAR_SEGMENT_ACTIVE_CLASS : CATALOG_TOOLBAR_SEGMENT_INACTIVE_CLASS
  );
}
