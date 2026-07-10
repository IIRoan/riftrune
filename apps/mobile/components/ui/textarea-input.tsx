import {
  INPUT_TEXTAREA_SHELL_CLASS,
} from "@/constants/catalogToolbar";
import { cn } from "@/lib/utils";
import {
  Input,
  InputPressable,
  type InputProps,
  useInputFocusState,
} from "./input";

// Types
export type TextareaInputProps = InputProps & {
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
};

// Components
export const TextareaInput = ({
  onFocus,
  onBlur,
  disabled,
  invalid,
  className,
  ...props
}: TextareaInputProps) => {
  const { isFocused, internalRef, handleFocus, handleBlur, handlePress } =
    useInputFocusState({ onFocus, onBlur });

  return (
    <InputPressable
      bordered
      className={cn(INPUT_TEXTAREA_SHELL_CLASS, className)}
      disabled={disabled}
      focused={isFocused}
      invalid={invalid}
      onPress={handlePress}
    >
      <Input
        {...props}
        className={cn("min-h-24 w-full", className)}
        disabled={disabled}
        multiline
        onBlur={handleBlur}
        onFocus={handleFocus}
        pointerEvents={isFocused || disabled ? undefined : "none"}
        ref={internalRef}
        scrollEnabled={false}
        textAlignVertical="top"
      />
    </InputPressable>
  );
};
