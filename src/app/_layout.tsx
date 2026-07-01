import "@/theme/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { View } from "react-native";

import { SoundProvider, useSound } from "@/audio/SoundProvider";
import { DeveloperSplashScreen } from "@/components/DeveloperSplashScreen";
import { useGameStore } from "@/store/gameStore";
import { useThemeColors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <SoundProvider>
      <RootLayoutContent />
    </SoundProvider>
  );
}

function RootLayoutContent() {
  const [isDeveloperSplashVisible, setDeveloperSplashVisible] = useState(true);
  const { setIntroFinished } = useSound();
  const theme = useThemeColors();
  const themeMode = useGameStore((state) => state.themeMode);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.canvas }}>
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.canvas },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.canvas },
          headerTitleStyle: { color: theme.ink, fontWeight: "700" }
        }}
      />
      {isDeveloperSplashVisible ? (
        <DeveloperSplashScreen
          onFinish={() => {
            setDeveloperSplashVisible(false);
            setIntroFinished();
          }}
        />
      ) : null}
    </View>
  );
}
