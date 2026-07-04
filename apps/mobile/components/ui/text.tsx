import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { fontFamilyForClassName } from "@/lib/fonts";
import { cn } from "@/lib/utils";

// Components
export const Text = ({
  children,
  className,
  style,
  ...props
}: RNTextProps) => {
  const merged = cn("font-sans font-normal text-base text-foreground", className);

  return (
    <RNText
      className={merged}
      style={[{ fontFamily: fontFamilyForClassName(merged) }, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};
