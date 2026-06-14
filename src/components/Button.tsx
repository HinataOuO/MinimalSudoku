import { Pressable, Text } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
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

export function Button({
  label,
  onPress,
  disabled = false,
  variant = "primary"
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`items-center justify-center rounded-lg border px-4 py-3 ${
        buttonClass[variant]
      } ${disabled ? "opacity-40" : "active:opacity-80"}`}
    >
      <Text className={`text-base font-semibold ${textClass[variant]}`}>{label}</Text>
    </Pressable>
  );
}
