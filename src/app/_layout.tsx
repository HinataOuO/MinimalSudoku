import "@/theme/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { SoundProvider } from "@/audio/SoundProvider";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <SoundProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.canvas },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.canvas },
          headerTitleStyle: { color: colors.ink, fontWeight: "700" }
        }}
      />
    </SoundProvider>
  );
}
