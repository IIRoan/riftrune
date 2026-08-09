export type SlashSearchAction = 'focus' | 'clear' | null;

type SlashKeyEvent = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  target?: EventTarget | null;
};

function isBareSlashKey(event: SlashKeyEvent): boolean {
  return event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey;
}

function isEditableTarget(target: EventTarget | null | undefined): boolean {
  if (!target || typeof target !== 'object') return false;

  const el = target as {
    tagName?: string;
    isContentEditable?: boolean;
    closest?: (selector: string) => Element | null;
  };

  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  if (typeof el.closest === 'function' && el.closest('[contenteditable="true"]')) {
    return true;
  }

  return false;
}

/**
 * Resolve what `/` should do for catalog search (window-level shortcut).
 * - Outside editables → focus search
 * - Already in our search field → clear so the user can retype
 * - Other inputs/textareas → ignore
 */
export function resolveSlashSearchAction(
  event: SlashKeyEvent,
  searchFocused: boolean
): SlashSearchAction {
  if (!isBareSlashKey(event)) return null;

  if (searchFocused) return 'clear';

  if (isEditableTarget(event.target)) return null;

  return 'focus';
}

/**
 * RN-web often inserts `/` before window preventDefault wins.
 * `/` is a search shortcut, never a query character — any value containing it
 * means "clear and retype".
 */
export function isSlashShortcutTextChange(next: string): boolean {
  return next.includes('/');
}

export function shouldFocusSearchOnSlashKey(event: SlashKeyEvent): boolean {
  return resolveSlashSearchAction(event, false) === 'focus';
}
