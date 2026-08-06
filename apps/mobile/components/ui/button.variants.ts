import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'flex w-full shrink-0 flex-row items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm',
  {
    variants: {
      size: {
        default: 'h-12 px-4',
        sm: 'h-8 gap-1 px-3',
        lg: 'h-14 px-6',
        'icon-sm': 'size-8',
        icon: 'size-12',
        'icon-lg': 'size-14',
      },
      variant: {
        default: 'bg-primary active:bg-primary/80',
        destructive: 'bg-destructive active:bg-destructive/80 dark:bg-destructive/60',
        outline:
          'border border-border bg-background active:bg-accent/90 dark:border-input dark:bg-input/30 dark:active:bg-input/50',
        secondary: 'bg-secondary active:bg-secondary/50',
        ghost: 'bg-background active:bg-accent/90 dark:active:bg-accent/50',
        link: 'h-auto w-auto p-0 active:opacity-50',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const buttonTextVariants = cva('whitespace-nowrap font-semibold text-sm', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground dark:text-accent-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-accent-foreground',
      link: 'text-primary',
    },
    size: {
      default: 'text-lg',
      sm: 'text-sm',
      lg: 'text-xl',
      'icon-sm': '',
      icon: '',
      'icon-lg': '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export const buttonIconVariants = cva('', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground dark:text-accent-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-accent-foreground',
      link: 'text-primary',
    },
    size: {
      default: 'size-6',
      lg: 'size-7',
      sm: 'size-5',
      'icon-sm': 'size-6',
      icon: 'size-7',
      'icon-lg': 'size-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export const buttonSpinnerVariants = cva('', {
  variants: {
    variant: {
      default: 'accent-primary-foreground',
      destructive: 'accent-white',
      outline: 'accent-foreground dark:accent-accent-foreground',
      secondary: 'accent-secondary-foreground',
      ghost: 'accent-accent-foreground',
      link: 'accent-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
