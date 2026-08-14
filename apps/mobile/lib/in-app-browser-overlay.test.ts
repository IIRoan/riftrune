import { describe, expect, mock, test } from 'bun:test';

const Platform = { OS: 'ios' as string };

mock.module('react-native', () => ({
  Platform,
}));

const {
  isInAppBrowserOverlaySuspended,
  setInAppBrowserOverlaySuspended,
  shouldMountFullWindowOverlay,
  subscribeInAppBrowserOverlay,
  withInAppBrowserOverlaySuspended,
} = await import('@/lib/in-app-browser-overlay');

describe('shouldMountFullWindowOverlay', () => {
  test('mounts on iOS while the in-app browser is closed', () => {
    expect(
      shouldMountFullWindowOverlay({ platform: 'ios', inAppBrowserOpen: false })
    ).toBe(true);
  });

  test('unmounts on iOS while the in-app browser is open', () => {
    expect(
      shouldMountFullWindowOverlay({ platform: 'ios', inAppBrowserOpen: true })
    ).toBe(false);
  });

  test('never mounts on Android or web', () => {
    expect(
      shouldMountFullWindowOverlay({ platform: 'android', inAppBrowserOpen: false })
    ).toBe(false);
    expect(
      shouldMountFullWindowOverlay({ platform: 'web', inAppBrowserOpen: false })
    ).toBe(false);
  });
});

describe('in-app browser overlay store', () => {
  test('notifies subscribers when suspended', () => {
    setInAppBrowserOverlaySuspended(false);
    const seen: boolean[] = [];
    const unsubscribe = subscribeInAppBrowserOverlay(() => {
      seen.push(isInAppBrowserOverlaySuspended());
    });

    setInAppBrowserOverlaySuspended(true);
    setInAppBrowserOverlaySuspended(true);
    setInAppBrowserOverlaySuspended(false);
    unsubscribe();

    expect(seen).toEqual([true, false]);
    expect(isInAppBrowserOverlaySuspended()).toBe(false);
  });

  test('suspends on iOS for the wrapped task and resumes after success or throw', async () => {
    Platform.OS = 'ios';
    setInAppBrowserOverlaySuspended(false);
    let suspendedDuringRun = false;

    await withInAppBrowserOverlaySuspended(async () => {
      suspendedDuringRun = isInAppBrowserOverlaySuspended();
    });
    expect(suspendedDuringRun).toBe(true);
    expect(isInAppBrowserOverlaySuspended()).toBe(false);

    await expect(
      withInAppBrowserOverlaySuspended(async () => {
        throw new Error('browser failed');
      })
    ).rejects.toThrow('browser failed');
    expect(isInAppBrowserOverlaySuspended()).toBe(false);
  });

  test('does not suspend on Android', async () => {
    Platform.OS = 'android';
    setInAppBrowserOverlaySuspended(false);
    let suspendedDuringRun = false;

    await withInAppBrowserOverlaySuspended(async () => {
      suspendedDuringRun = isInAppBrowserOverlaySuspended();
    });

    expect(suspendedDuringRun).toBe(false);
    expect(isInAppBrowserOverlaySuspended()).toBe(false);
    Platform.OS = 'ios';
  });
});
