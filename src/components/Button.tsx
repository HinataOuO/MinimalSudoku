import { forwardRef, type ElementRef, type ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";

import { useSound } from "@/audio/SoundProvider";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  icon?: ReactNode;
  label: string;
  variant?: ButtonVariant;
};

const buttonClass: Record<ButtonVariant, string> = {
  primary: "bg-accent border-accent",
  secondary: "bg-panelElevated border-line",
  ghost: "bg-transparent border-line"
};

const textClass: Record<ButtonVariant, string> = {
  primary: "text-accentInk",
  secondary: "text-ink",
  ghost: "text-muted"
};

export const Button = forwardRef<ElementRef<typeof Pressable>, ButtonProps>(function Button(
  {
    icon,
    label,
    disabled = false,
    variant = "primary",
    className = "",
    hitSlop = 8,
    onPress,
    ...pressableProps
  },
  ref
) {
  const { playUiClick } = useSound();

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={(event) => {
        playUiClick();
        onPress?.(event);
      }}
      className={`items-center justify-center rounded-md border px-5 py-3 ${
        buttonClass[variant]
      } ${disabled ? "opacity-35" : "active:opacity-75"} ${className}`}
    >
      <View className="flex-row items-center justify-center gap-2">
        {icon}
        <Text className={`text-base font-medium tracking-wide ${textClass[variant]}`}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
});
