import type { Dispatch, SetStateAction } from 'react';

/** Switch or close filter menus without a stale overlay dismiss wiping the new selection. */
export function applyFilterPopoverOpenChange<T extends string>(
  segment: T,
  open: boolean,
  setOpenSegment: Dispatch<SetStateAction<T | null>>
): void {
  setOpenSegment((current) => {
    if (open) return segment;
    return current === segment ? null : current;
  });
}
