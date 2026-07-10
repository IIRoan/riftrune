import { INPUT_SHELL_CLASS } from "@/constants/catalogToolbar";
import { cn } from "@/lib/utils";
import {
  Input,
  type InputAddonChildren,
  InputPressable,
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
export const TextInput = ({
  onFocus,
  onBlur,
  disabled,
  invalid,
  children,
  className,
  ...props
}: TextInputProps) => {
  const { isFocused, internalRef, handleFocus, handleBlur, handlePress } =
    useInputFocusState({ onFocus, onBlur });

  const { startAddons, endAddons, pressableClassName } =
    useInputAddons(children);

  return (
    <InputPressable
      bordered
      className={cn(pressableClassName, INPUT_SHELL_CLASS, className)}
      disabled={disabled}
      focused={isFocused}
      invalid={invalid}
      onPress={handlePress}
    >
      {startAddons}

      <Input
        {...props}
        className="shrink"
        disabled={disabled}
        onBlur={handleBlur}
        onFocus={handleFocus}
        ref={internalRef}
      />

      {endAddons}
    </InputPressable>
  );
};
