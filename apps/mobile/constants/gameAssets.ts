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

export function typeIconFor(name: string): ImageSourcePropType | undefined {
  return TYPE_ICONS[name];
}

export function rarityIconFor(name: string): ImageSourcePropType | undefined {
  return RARITY_ICONS[name];
}
