import type { VariantProps } from 'class-variance-authority';
import type { Pressable } from 'react-native';
import type { chipVariants } from '@/components/ui/chip.variants';

export type ChipProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof chipVariants> & {
    children: React.ReactNode;
  };
