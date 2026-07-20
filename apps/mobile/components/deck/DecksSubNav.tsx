import { usePathname, useRouter } from 'expo-router';
import {
  FLOATING_PILL_NAV_CLEARANCE,
  FloatingPillNav,
  type FloatingPillNavItem,
} from '@/components/shell/FloatingPillNav';

/** @deprecated Prefer FLOATING_PILL_NAV_CLEARANCE — kept for existing deck list imports. */
export const DECKS_SUB_NAV_CLEARANCE = FLOATING_PILL_NAV_CLEARANCE;

const NAV_ITEMS: readonly FloatingPillNavItem<'mine' | 'browse'>[] = [
  {
    id: 'mine',
    label: 'Mine',
    accessibilityLabel: 'My decks',
    icon: 'albums-outline',
    iconActive: 'albums',
  },
  {
    id: 'browse',
    label: 'Browse',
    accessibilityLabel: 'Browse decks',
    icon: 'compass-outline',
    iconActive: 'compass',
  },
];

function isBrowseDecksPath(pathname: string): boolean {
  return pathname.includes('/decks/browse');
}

/** Decks Mine / Browse — shared FloatingPillNav. */
export function DecksSubNav() {
  const router = useRouter();
  const pathname = usePathname();
  const browseActive = isBrowseDecksPath(pathname);

  return (
    <FloatingPillNav
      items={NAV_ITEMS}
      value={browseActive ? 'browse' : 'mine'}
      onChange={(id) => {
        router.push(id === 'browse' ? '/(tabs)/decks/browse' : '/(tabs)/decks');
      }}
    />
  );
}
