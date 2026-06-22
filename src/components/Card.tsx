import { PropsWithChildren } from "react";
import { View } from "react-native";

import { useThemeColors } from "@/theme/colors";

export function Card({ children }: PropsWithChildren) {
  const theme = useThemeColors();

  return (
    <View
      className="rounded-md border border-line bg-panel p-5"
      style={{ backgroundColor: theme.panel, borderColor: theme.line }}
    >
      {children}
    </View>
  );
}
