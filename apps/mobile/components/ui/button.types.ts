import type { VariantProps } from 'class-variance-authority';
import type { Pressable } from 'react-native';
import type { buttonVariants } from '@/components/ui/button.variants';

type InternalButtonContextType = VariantProps<typeof buttonVariants> & {
  busy?: boolean;
  disabled?: boolean;
};

export type ButtonProps = React.ComponentProps<typeof Pressable> &
  InternalButtonContextType & {
    children: React.ReactNode;
  };
