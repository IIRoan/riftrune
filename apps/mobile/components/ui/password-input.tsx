import { forwardRef, useState } from "react";
import type { TextInput as RNTextInput } from "react-native";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { InputAddon, InputAddonButton, InputAddonButtonIcon } from "./input";
import { TextInput, type TextInputProps } from "./text-input";

// Types
export type PasswordInputProps = Omit<
  TextInputProps,
  "rightElement" | "secureTextEntry"
>;

// Components
export const PasswordInput = forwardRef<RNTextInput, PasswordInputProps>(
  ({ onFocus, onBlur, disabled, ...props }, ref) => {
    const [isSecureEntry, setIsSecureEntry] = useState(true);

    const Icon = isSecureEntry ? EyeOffIcon : EyeIcon;

    return (
      <TextInput
        {...props}
        ref={ref}
        disabled={disabled}
        onBlur={onBlur}
        onFocus={onFocus}
        secureTextEntry={isSecureEntry}
        // Keep autofill association even when visibility is toggled.
        textContentType={props.textContentType}
        autoComplete={props.autoComplete}
      >
        <InputAddon align="inline-end">
          <InputAddonButton
            accessibilityLabel={isSecureEntry ? "Show password" : "Hide password"}
            disabled={disabled}
            onPress={() => {
              setIsSecureEntry((previous) => !previous);
            }}
            size="icon"
            variant="ghost"
          >
            <InputAddonButtonIcon>
              <Icon />
            </InputAddonButtonIcon>
          </InputAddonButton>
        </InputAddon>
      </TextInput>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
