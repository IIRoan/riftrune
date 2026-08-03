import { forwardRef, useEffect } from "react";
import { View, type TextInput as RNTextInput } from "react-native";
import { INPUT_SHELL_CLASS } from "@/constants/catalogToolbar";
import { cn } from "@/lib/utils";
import {
  Input,
  type InputAddonChildren,
  type InputProps,
  useInputAddons,
  useInputFocusState,
} from "./input";

// Types
export type TextInputProps = InputProps & {
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  children?: InputAddonChildren;
};

// Components
/**
 * Single-line text field. Intentionally NOT wrapped in InputPressable —
 * a parent Pressable steals the touch responder on web/native and jumps
 * the caret to the end when clicking mid-text (same fix as TextareaInput).
 */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    { onFocus, onBlur, disabled, invalid, children, className, ...props },
    ref
  ) => {
    const { isFocused, internalRef, handleFocus, handleBlur } =
      useInputFocusState({ onFocus, onBlur });

    useEffect(() => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(internalRef.current);
        return () => {
          ref(null);
        };
      }
      ref.current = internalRef.current;
      return;
    });

    const { startAddons, endAddons, pressableClassName } =
      useInputAddons(children);

    return (
      <View
        className={cn(
          pressableClassName,
          INPUT_SHELL_CLASS,
          "flex-row items-center gap-2 border",
          !invalid && !isFocused && "border-border",
          !invalid && isFocused && "border-ring/50",
          invalid && "border-destructive",
          disabled && "opacity-50",
          className
        )}
      >
        {startAddons}

        <Input
          {...props}
          className="min-w-0 flex-1 shrink"
          disabled={disabled}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={internalRef}
        />

        {endAddons}
      </View>
    );
  }
);

TextInput.displayName = "TextInput";
