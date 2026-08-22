import { Children, isValidElement, useCallback, useRef, useState } from 'react';
import type { BlurEvent, FocusEvent, TextInput } from 'react-native';
import { InputAddon } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { InputAddonChild, InputAddonChildren } from '@/components/ui/input.types';

type UseInputFocusStateProps = {
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: BlurEvent) => void;
};

export const useInputFocusState = ({ onFocus, onBlur }: UseInputFocusStateProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const internalRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const handleFocus = useCallback(
    (e: FocusEvent) => {
      onFocus?.(e);

      setIsFocused(true);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: BlurEvent) => {
      onBlur?.(e);

      setIsFocused(false);
    },
    [onBlur]
  );

  const handlePress = useCallback(() => {
    // Skip re-focus when already focused — jumps caret to end (esp. web Pressable taps).
    if (isFocused) return;
    internalRef.current?.focus();
  }, [isFocused]);

  return {
    isFocused,
    internalRef,
    handleFocus,
    handleBlur,
    handlePress,
  };
};

export const useInputAddons = (
  children?: InputAddonChildren | React.ReactElement | null
) => {
  const startAddons: InputAddonChild[] = [];
  const endAddons: InputAddonChild[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === InputAddon) {
      const typedChild = child as InputAddonChild;

      if (typedChild) {
        if (
          typeof typedChild.props.align === 'undefined' ||
          typedChild.props.align === 'inline-start'
        ) {
          startAddons.push(typedChild);
        } else {
          endAddons.push(typedChild);
        }
      }
    }
  });

  return {
    startAddons,
    endAddons,
    pressableClassName: cn(startAddons.length && 'pl-0', endAddons.length && 'pr-0'),
  };
};
