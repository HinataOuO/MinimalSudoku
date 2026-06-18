import { forwardRef, type ElementRef } from "react";
import { Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
};

const buttonClass: Record<ButtonVariant, string> = {
  primary: "bg-accent border-accent",
  secondary: "bg-panel border-line",
  ghost: "bg-transparent border-line"
};

const textClass: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-ink",
  ghost: "text-ink"
};

export const Button = forwardRef<ElementRef<typeof Pressable>, ButtonProps>(function Button(
  {
    label,
    disabled = false,
    variant = "primary",
    className = "",
    hitSlop = 8,
    ...pressableProps
  },
  ref
) {
  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={hitSlop}
      className={`items-center justify-center rounded-lg border px-4 py-3 ${
        buttonClass[variant]
      } ${disabled ? "opacity-40" : "active:opacity-80"} ${className}`}
    >
      <Text className={`text-base font-semibold ${textClass[variant]}`}>{label}</Text>
    </Pressable>
  );
});
