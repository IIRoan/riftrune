import { cva, type VariantProps } from "class-variance-authority";
import {
  Children,
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type GestureResponderEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { MOTION, PRESS } from "@/lib/motion";
import { textFontStyleForClassName } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Types
type InternalButtonContextType = VariantProps<typeof buttonVariants> & {
  busy?: boolean;
  disabled?: boolean;
};

type ButtonChildProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.ComponentProps<typeof Text>['style'];
};

export type ButtonProps = React.ComponentProps<typeof Pressable> &
  InternalButtonContextType & {
    children: React.ReactNode;
  };

// Context
const ButtonContext = createContext<InternalButtonContextType | null>(null);

const useButtonContext = () => {
  const context = useContext(ButtonContext);
  if (!context) {
    throw new Error("useButtonContext must be used within a Button component");
  }
  return context;
};

// Components
export const Button = ({
  className,
  variant,
  size,
  busy,
  disabled,
  children,
  accessibilityRole = "button",
  onPressIn,
  onPressOut,
  style,
  ...props
}: ButtonProps) => {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const ctx = useMemo(() => {
    return {
      variant,
      size,
      busy,
      disabled,
    };
  }, [variant, size, busy, disabled]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (!(disabled || busy)) {
        if (reduceMotion) {
          opacity.value = withTiming(0.75, { duration: PRESS.inMs });
        } else {
          scale.value = withTiming(PRESS.depth, { duration: PRESS.inMs });
        }
      }
      onPressIn?.(event);
    },
    [busy, disabled, onPressIn, opacity, reduceMotion, scale]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (reduceMotion) {
        opacity.value = withTiming(1, { duration: 140 });
      } else {
        scale.value = withSpring(1, MOTION.bouncy);
      }
      onPressOut?.(event);
    },
    [onPressOut, opacity, reduceMotion, scale]
  );

  return (
    <ButtonContext.Provider value={ctx}>
      <AnimatedPressable
        accessibilityRole={accessibilityRole}
        accessibilityState={{ busy, disabled }}
        className={cn(
          buttonVariants({ variant, size }),
          className,
          disabled && "opacity-50"
        )}
        disabled={disabled || busy}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[pressStyle, style]}
        {...props}
      >
        {Children.map(children, (child) => {
          if (typeof child === "string") {
            if (size === "icon") {
              // Icon buttons shouldn't render text
              return null;
            }
            return <ButtonText>{child}</ButtonText>;
          }

          return child;
        })}
        {busy ? <ButtonSpinner /> : null}
      </AnimatedPressable>
    </ButtonContext.Provider>
  );
};

export const ButtonText = (props: ButtonChildProps) => {
  const ctx = useButtonContext();
  const merged = cn(
    buttonTextVariants(ctx),
    ctx.busy && "opacity-0",
    props.className
  );

  return (
    <Text
      {...props}
      className={merged}
      style={[textFontStyleForClassName(merged), props.style]}
    />
  );
};

export const ButtonIcon = ({ children, ...props }: ButtonChildProps) => {
  const ctx = useButtonContext();

  const child = Children.only(children);

  if (!child) {
    if (__DEV__) {
      throw new Error("ButtonIcon expects a single React element as children");
    }
    return null;
  }

  return cloneElement(child as React.ReactElement<ButtonChildProps>, {
    ...props,
    className: cn(
      buttonIconVariants(ctx),
      ctx.busy && "opacity-0",
      props.className
    ),
  });
};

const ButtonSpinner = () => {
  const ctx = useButtonContext();

  return (
    <ActivityIndicator
      className="absolute"
      colorClassName={buttonSpinnerVariants(ctx)}
    />
  );
};

// Styles
export const buttonVariants = cva(
  "flex w-full shrink-0 flex-row items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm",
  {
    variants: {
      size: {
        default: "h-12 px-4",
        sm: "h-8 gap-1 px-3",
        lg: "h-14 px-6",
        "icon-sm": "size-8",
        icon: "size-12",
        "icon-lg": "size-14",
      },
      variant: {
        default: "bg-primary active:bg-primary/80",
        destructive:
          "bg-destructive active:bg-destructive/80 dark:bg-destructive/60",
        outline:
          "border border-border bg-background active:bg-accent/90 dark:border-input dark:bg-input/30 dark:active:bg-input/50",
        secondary: "bg-secondary active:bg-secondary/50",
        ghost: "bg-background active:bg-accent/90 dark:active:bg-accent/50",
        link: "h-auto w-auto p-0 active:opacity-50",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const buttonTextVariants = cva(
  "whitespace-nowrap font-semibold text-sm",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-white",
        outline: "text-foreground dark:text-accent-foreground",
        secondary: "text-secondary-foreground",
        ghost: "text-accent-foreground",
        link: "text-primary",
      },
      size: {
        default: "text-lg",
        sm: "text-sm",
        lg: "text-xl",
        "icon-sm": "",
        icon: "",
        "icon-lg": "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const buttonIconVariants = cva("", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-white",
      outline: "text-foreground dark:text-accent-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-accent-foreground",
      link: "text-primary",
    },
    size: {
      default: "size-6",
      lg: "size-7",
      sm: "size-5",
      "icon-sm": "size-6",
      icon: "size-7",
      "icon-lg": "size-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export const buttonSpinnerVariants = cva("", {
  variants: {
    variant: {
      default: "accent-primary-foreground",
      destructive: "accent-white",
      outline: "accent-foreground dark:accent-accent-foreground",
      secondary: "accent-secondary-foreground",
      ghost: "accent-accent-foreground",
      link: "accent-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
