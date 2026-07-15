import type { ImageSourcePropType } from 'react-native';

const TYPE_ICONS: Record<string, ImageSourcePropType> = {
  Legend: require('@/assets/types/legend.webp'),
  Legends: require('@/assets/types/legend.webp'),
  Unit: require('@/assets/types/unit.webp'),
  Units: require('@/assets/types/unit.webp'),
  Spell: require('@/assets/types/spell.webp'),
  Spells: require('@/assets/types/spell.webp'),
  Gear: require('@/assets/types/gear.webp'),
  Battlefield: require('@/assets/types/battlefield.webp'),
  Battlefields: require('@/assets/types/battlefield.webp'),
  Rune: require('@/assets/types/rune.webp'),
  Runes: require('@/assets/types/rune.webp'),
};

const RARITY_ICONS: Record<string, ImageSourcePropType> = {
  Common: require('@/assets/rarities/Common.webp'),
  Uncommon: require('@/assets/rarities/Uncommon.webp'),
  Rare: require('@/assets/rarities/Rare.webp'),
  Epic: require('@/assets/rarities/Epic.webp'),
  Showcase: require('@/assets/rarities/Showcase.webp'),
};

const DOMAIN_ICONS: Record<string, ImageSourcePropType> = {
  Fury: require('@/assets/colors/Fury.webp'),
  Calm: require('@/assets/colors/Calm.webp'),
  Mind: require('@/assets/colors/Mind.webp'),
  Body: require('@/assets/colors/Body.webp'),
  Chaos: require('@/assets/colors/Chaos.webp'),
  Order: require('@/assets/colors/Order.webp'),
};

export function typeIconFor(name: string): ImageSourcePropType | undefined {
  return TYPE_ICONS[name];
}

export function rarityIconFor(name: string): ImageSourcePropType | undefined {
  return RARITY_ICONS[name];
}

export function domainIconFor(name: string): ImageSourcePropType | undefined {
  if (DOMAIN_ICONS[name]) return DOMAIN_ICONS[name];
  const key = Object.keys(DOMAIN_ICONS).find(
    (domain) => domain.toLowerCase() === name.toLowerCase()
  );
  return key ? DOMAIN_ICONS[key] : undefined;
}

export function isDomainName(name: string): boolean {
  return domainIconFor(name) !== undefined;
}

/** Unique bundled icons used by catalog filter panels (type, rarity, domain). */
export function allFilterPanelIconSources(): ImageSourcePropType[] {
  const seen = new Set<ImageSourcePropType>();
  const sources: ImageSourcePropType[] = [];
  const add = (source: ImageSourcePropType | undefined) => {
    if (!source || seen.has(source)) return;
    seen.add(source);
    sources.push(source);
  };

  for (const source of Object.values(TYPE_ICONS)) add(source);
  for (const source of Object.values(RARITY_ICONS)) add(source);
  for (const source of Object.values(DOMAIN_ICONS)) add(source);

  return sources;
}

export const mightIcon = require('@/assets/icons/might.webp') as ImageSourcePropType;
export const tapIcon = require('@/assets/icons/tap.webp') as ImageSourcePropType;
export const runeIcon = require('@/assets/icons/rune.webp') as ImageSourcePropType;
