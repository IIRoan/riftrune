import { cva } from 'class-variance-authority';

export const inputAddonVariants = cva('flex items-center justify-center', {
  variants: {
    align: {
      'inline-start': 'pl-3',
      'inline-end': 'pr-3',
    },
  },
  defaultVariants: {
    align: 'inline-start',
  },
});

export const inputAddonButtonVariants = cva('w-fit gap-1 shadow-none', {
  variants: {
    size: { sm: 'h-8 px-2', icon: 'size-7' },
  },
  defaultVariants: {
    size: 'sm',
  },
});

export const inputAddonButtonIconVariants = cva('', {
  variants: {
    variant: {
      default: 'text-cta-foreground',
      destructive: 'text-white',
      outline: 'text-muted-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-muted-foreground',
      link: 'text-muted-foreground',
    },
    size: {
      sm: 'size-4',
      icon: 'size-5',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});
