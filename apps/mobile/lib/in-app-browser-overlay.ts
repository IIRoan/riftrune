import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/** Suspend iOS FullWindowOverlay during expo-web-browser so SFSafariViewController isn't covered by the card drawer. */
let suspended = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function isInAppBrowserOverlaySuspended(): boolean {
  return suspended;
}

export function subscribeInAppBrowserOverlay(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function setInAppBrowserOverlaySuspended(next: boolean): void {
  if (suspended === next) return;
  suspended = next;
  notify();
}

export function useInAppBrowserOverlaySuspended(): boolean {
  return useSyncExternalStore(
    subscribeInAppBrowserOverlay,
    isInAppBrowserOverlaySuspended,
    isInAppBrowserOverlaySuspended
  );
}

export function shouldMountFullWindowOverlay(input: {
  platform: typeof Platform.OS;
  inAppBrowserOpen: boolean;
}): boolean {
  return input.platform === 'ios' && !input.inAppBrowserOpen;
}

function schedulePaint(cb: () => void): void {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      cb();
    });
    return;
  }
  setTimeout(cb, 0);
}

function yieldForOverlayUnmount(): Promise<void> {
  return new Promise((resolve) => {
    schedulePaint(() => {
      schedulePaint(resolve);
    });
  });
}

export async function withInAppBrowserOverlaySuspended<T>(
  run: () => Promise<T>
): Promise<T> {
  if (Platform.OS !== 'ios') {
    return await run();
  }
  setInAppBrowserOverlaySuspended(true);
  try {
    await yieldForOverlayUnmount();
    return await run();
  } finally {
    setInAppBrowserOverlaySuspended(false);
  }
}
