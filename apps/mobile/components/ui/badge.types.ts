import type { VariantProps } from 'class-variance-authority';
import type { View } from 'react-native';
import type { badgeVariants } from '@/components/ui/badge.variants';

export type BadgeProps = React.ComponentProps<typeof View> &
  VariantProps<typeof badgeVariants> & {
    children: React.ReactNode;
  };
