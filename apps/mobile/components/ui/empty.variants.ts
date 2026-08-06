import { cva } from 'class-variance-authority';

export const emptyMediaVariants = cva(
  'mb-2 flex shrink-0 items-center justify-center',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: 'flex shrink-0 items-center justify-center rounded-full bg-muted p-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
