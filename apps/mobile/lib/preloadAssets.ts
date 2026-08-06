import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { allFilterPanelIconSources } from '@/constants/gameAssets';
import { SET_CATALOG } from '@/constants/setCatalog';
import { markSessionImageLoaded } from '@/lib/imageSessionCache';

/** Auth wallpapers — needed before AuthGate paints. */
const CRITICAL_LOCAL_ASSETS: number[] = [
  require('@/assets/wallpapers/wallpaper.jpg'),
  require('@/assets/wallpapers/wallpaper2.jpg'),
];

function moduleIdsFromSources(sources: ImageSourcePropType[]): number[] {
  const ids: number[] = [];
  for (const source of sources) {
    if (typeof source === 'number') ids.push(source);
  }
  return ids;
}

/** Every set art + logo shown on the collection dashboard. */
export function collectionDashboardAssetModules(): number[] {
  const modules: number[] = [];
  for (const entry of SET_CATALOG) {
    if (typeof entry.art === 'number') modules.push(entry.art);
    if (typeof entry.logo === 'number') modules.push(entry.logo);
  }
  return modules;
}

function resolvedAssetUris(modules: number[]): string[] {
  const uris: string[] = [];
  for (const moduleId of modules) {
    try {
      const uri = Asset.fromModule(moduleId).uri;
      if (uri) uris.push(uri);
    } catch {
      // Ignore unresolved modules.
    }
  }
  return uris;
}

async function loadAndWarmLocalModules(modules: number[]): Promise<void> {
  if (modules.length === 0) return;
  const unique = [...new Set(modules)];
  try {
    await Asset.loadAsync(unique);
  } catch {
    // Best-effort — UI still falls back to on-demand asset decode.
  }

  const uris = resolvedAssetUris(unique);
  if (uris.length === 0) return;
  try {
    const ok = await Image.prefetch(uris, { cachePolicy: 'memory-disk' });
    if (ok) {
      for (const uri of uris) markSessionImageLoaded(uri);
    }
  } catch {
    // Ignore image cache warm failures.
  }
}

/**
 * Download bundled assets into the Expo asset cache before first paint.
 * Uses expo-asset (ships with Expo SDK) — keeps auth + filter icons instant.
 */
export async function preloadCriticalLocalAssets(): Promise<void> {
  await loadAndWarmLocalModules([
    ...CRITICAL_LOCAL_ASSETS,
    ...moduleIdsFromSources(allFilterPanelIconSources()),
  ]);
}

/**
 * Collection dashboard set banners, logos, and type/rarity icons —
 * load as if the page was already visited.
 */
export async function preloadCollectionDashboardAssets(): Promise<void> {
  await loadAndWarmLocalModules([
    ...collectionDashboardAssetModules(),
    ...moduleIdsFromSources(allFilterPanelIconSources()),
  ]);
}
