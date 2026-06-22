import "@/theme/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { SoundProvider } from "@/audio/SoundProvider";
import { useGameStore } from "@/store/gameStore";
import { useThemeColors } from "@/theme/colors";

export default function RootLayout() {
  const theme = useThemeColors();
  const themeMode = useGameStore((state) => state.themeMode);

  return (
    <SoundProvider>
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.canvas },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.canvas },
          headerTitleStyle: { color: theme.ink, fontWeight: "700" }
        }}
      />
    </SoundProvider>
  );
}
