export type AppUpdatePhase =
  'idle' | 'available' | 'downloading' | 'ready' | 'restarting' | 'error';

export type AppUpdateSnapshot = {
  enabled: boolean;
  isRestarting: boolean;
  isDownloading: boolean;
  isUpdatePending: boolean;
  isUpdateAvailable: boolean;
  downloadError: boolean;
  dismissed: boolean;
};

export function resolveAppUpdatePhase(snapshot: AppUpdateSnapshot): AppUpdatePhase {
  if (!snapshot.enabled) return 'idle';
  if (snapshot.isRestarting) return 'restarting';
  if (snapshot.isDownloading) return 'downloading';
  if (snapshot.downloadError && !snapshot.dismissed) return 'error';
  if (snapshot.isUpdatePending && !snapshot.dismissed) return 'ready';
  if (snapshot.isUpdateAvailable && !snapshot.dismissed) return 'available';
  return 'idle';
}

/**
 * Settings CTA — Later only hides the full-screen dispatch.
 * A waiting bundle or failed download can still be installed this session.
 */
export function resolveAppUpdateAction(snapshot: AppUpdateSnapshot): AppUpdatePhase {
  return resolveAppUpdatePhase({ ...snapshot, dismissed: false });
}

export function formatChannelLabel(channel: string | null | undefined): string {
  const value = channel?.trim();
  if (!value) return 'MAIN';
  return value.toUpperCase();
}

export function formatUpdateId(id: string | null | undefined): string {
  if (!id) return 'embedded';
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export function formatDownloadPercent(progress: number | undefined): number {
  if (progress === undefined || Number.isNaN(progress)) return 0;
  return Math.max(0, Math.min(100, Math.round(progress * 100)));
}
