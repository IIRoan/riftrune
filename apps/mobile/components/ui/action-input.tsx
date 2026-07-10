import { INPUT_SHELL_CLASS } from "@/constants/catalogToolbar";
import { Text, View } from "react-native";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@/components/icons";
import {
  InputAddon,
  type InputAddonChildren,
  InputAddonIcon,
  InputPressable,
  type InputPressableProps,
  useInputAddons,
} from "./input";

// Types
export type ActionInputProps = InputPressableProps & {
  value?: string;
  placeholder: string;
  children?: InputAddonChildren;
};

// Components
export const ActionInput = ({
  value,
  placeholder,
  children,
  className,
  focused,
  invalid,
  disabled,
  ...props
}: ActionInputProps) => {
  const { startAddons, endAddons, pressableClassName } =
    useInputAddons(children);

  return (
    <InputPressable
      {...props}
      bordered
      className={cn(pressableClassName, INPUT_SHELL_CLASS, "pr-0", className)}
      disabled={disabled}
      focused={focused}
      invalid={invalid}
    >
      {startAddons}

      <View className="grow">
        {value ? (
          <Text className="text-base text-foreground">{value}</Text>
        ) : (
          <Text className="text-base text-muted-foreground">{placeholder}</Text>
        )}
      </View>

      {endAddons.length ? (
        endAddons
      ) : (
        <InputAddon align="inline-end">
          <InputAddonIcon>
            <ChevronRightIcon />
          </InputAddonIcon>
        </InputAddon>
      )}
    </InputPressable>
  );
};
