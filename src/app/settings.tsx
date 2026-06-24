import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import { Coffee, Home, Moon, Sun } from "lucide-react-native";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSound } from "@/audio/SoundProvider";
import { Button } from "@/components/Button";
import { useGameStore } from "@/store/gameStore";
import { useThemeColors } from "@/theme/colors";

const repositoryUrl = "https://github.com/HinataOuO/MinimalSudoku";

const audioPresets = [
  {
    accessibilityLabel: "Mute audio",
    label: "MUTE",
    muted: true,
    volume: 0
  },
  {
    accessibilityLabel: "Set volume to low",
    label: "LOW",
    muted: false,
    volume: 0.1
  },
  {
    accessibilityLabel: "Set volume to medium",
    label: "MID",
    muted: false,
    volume: 0.5
  },
  {
    accessibilityLabel: "Set volume to high",
    label: "HIGH",
    muted: false,
    volume: 1
  }
] as const;

export default function SettingsScreen() {
  const { playUiClick } = useSound();
  const theme = useThemeColors();

  return (
    <SafeAreaView
      className="flex-1 bg-canvas px-7 pb-8 pt-4"
      style={{ backgroundColor: theme.canvas }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="h-11 justify-center">
        <Pressable
          accessibilityLabel="Back home"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            playUiClick();
            router.replace("/");
          }}
          className="h-10 w-10 items-center justify-center rounded-md border border-line bg-transparent active:opacity-75"
          style={{ borderColor: theme.line }}
        >
          <Home color={theme.muted} size={20} strokeWidth={1.8} absoluteStrokeWidth />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          gap: 28,
          justifyContent: "center",
          paddingVertical: 24
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <Text
            className="text-4xl font-medium tracking-wide text-ink"
            style={{ color: theme.ink }}
          >
            Settings
          </Text>
          <Text
            className="max-w-sm text-base leading-6 text-muted"
            style={{ color: theme.muted }}
          >
            Audio, support, and project links.
          </Text>
        </View>

        <AppearanceSettings />
        <GameplaySettings />
        <AudioSettings />
        <DonationSettings />
        <DeveloperFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

function GameplaySettings() {
  const arcadeModeEnabled = useGameStore((state) => state.arcadeModeEnabled);
  const setArcadeModeEnabled = useGameStore((state) => state.setArcadeModeEnabled);
  const { playUiClick } = useSound();
  const theme = useThemeColors();

  return (
    <View
      className="gap-4 rounded-md border border-line bg-panel p-5"
      style={{ backgroundColor: theme.panel, borderColor: theme.line }}
    >
      <Text
        className="text-sm font-medium uppercase tracking-wide text-muted"
        style={{ color: theme.muted }}
      >
        Gameplay
      </Text>

      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-base font-medium text-ink" style={{ color: theme.ink }}>
            Arcade
          </Text>
          <Text className="text-sm leading-5 text-muted" style={{ color: theme.muted }}>
            Enables rapid input and disables completed numbers.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Toggle arcade mode"
          accessibilityRole="switch"
          onValueChange={(enabled) => {
            setArcadeModeEnabled(enabled);
            playUiClick();
          }}
          thumbColor={arcadeModeEnabled ? theme.accentInk : theme.muted}
          trackColor={{ false: theme.line, true: theme.accent }}
          value={arcadeModeEnabled}
        />
      </View>
    </View>
  );
}

function AppearanceSettings() {
  const themeMode = useGameStore((state) => state.themeMode);
  const toggleThemeMode = useGameStore((state) => state.toggleThemeMode);
  const { playUiClick } = useSound();
  const theme = useThemeColors();
  const isDark = themeMode === "dark";
  const ThemeIcon = isDark ? Moon : Sun;

  return (
    <View
      className="gap-4 rounded-md border border-line bg-panel p-5"
      style={{ backgroundColor: theme.panel, borderColor: theme.line }}
    >
      <Text
        className="text-sm font-medium uppercase tracking-wide text-muted"
        style={{ color: theme.muted }}
      >
        Appearance
      </Text>

      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-base font-medium text-ink" style={{ color: theme.ink }}>
            Theme
          </Text>
          <Text className="text-sm leading-5 text-muted" style={{ color: theme.muted }}>
            {isDark ? "Dark minimal palette" : "Light complementary palette"}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={`Current theme: ${themeMode}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            toggleThemeMode();
            playUiClick();
          }}
          className="h-11 w-11 items-center justify-center rounded-md border border-line bg-panelElevated active:opacity-75"
          style={{ backgroundColor: theme.panelElevated, borderColor: theme.line }}
        >
          <ThemeIcon color={theme.accent} size={21} strokeWidth={1.9} absoluteStrokeWidth />
        </Pressable>
      </View>
    </View>
  );
}

function AudioSettings() {
  const { muted, playUiClick, setVolume, volume } = useSound();
  const theme = useThemeColors();

  return (
    <View
      className="gap-4 rounded-md border border-line bg-panel p-5"
      style={{ backgroundColor: theme.panel, borderColor: theme.line }}
    >
      <Text
        className="text-sm font-medium uppercase tracking-wide text-muted"
        style={{ color: theme.muted }}
      >
        Audio
      </Text>
      <View
        className="h-11 flex-row overflow-hidden rounded-md border border-line bg-panelElevated"
        style={{ backgroundColor: theme.panelElevated, borderColor: theme.line }}
      >
        {audioPresets.map((preset) => {
          const isSelected = preset.muted
            ? muted || volume === 0
            : !muted && Math.abs(volume - preset.volume) < 0.01;

          return (
            <Pressable
              key={preset.label}
              accessibilityLabel={preset.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              hitSlop={6}
              onPress={() => {
                setVolume(preset.volume);
                if (!preset.muted) {
                  playUiClick();
                }
              }}
              className={`flex-1 items-center justify-center active:opacity-75 ${
                preset.muted ? "" : "border-l"
              } ${isSelected ? "bg-accent" : "bg-transparent"}`}
              style={{
                backgroundColor: isSelected ? theme.accent : "transparent",
                borderLeftColor: theme.line
              }}
            >
              <Text
                className={`text-xs font-medium tracking-wide ${
                  isSelected ? "text-accentInk" : "text-muted"
                }`}
                numberOfLines={1}
                style={{ color: isSelected ? theme.accentInk : theme.muted }}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DonationSettings() {
  const theme = useThemeColors();

  return (
    <View
      className="gap-4 rounded-md border border-line bg-panel p-5"
      style={{ backgroundColor: theme.panel, borderColor: theme.line }}
    >
      <Text
        className="text-sm font-medium uppercase tracking-wide text-muted"
        style={{ color: theme.muted }}
      >
        Support
      </Text>
      <Button
        disabled
        icon={<Coffee color={theme.accentInk} size={20} strokeWidth={1.9} absoluteStrokeWidth />}
        label="Buy me a coffee"
      />
      <Text className="text-sm leading-5 text-muted" style={{ color: theme.muted }}>
        Donation link not configured yet.
      </Text>
    </View>
  );
}

function DeveloperFooter() {
  const theme = useThemeColors();

  return (
    <View className="items-start gap-1">
      <Text className="text-xs leading-4 text-muted" style={{ color: theme.muted }}>
        Developer: HinataOuO
      </Text>
      <Pressable
        accessibilityLabel="Open GitHub repository"
        accessibilityRole="link"
        hitSlop={8}
        onPress={() => {
          void Linking.openURL(repositoryUrl);
        }}
        className="active:opacity-75"
      >
        <Text className="text-xs leading-4 text-muted" style={{ color: theme.muted }}>
          GitHub repository
        </Text>
      </Pressable>
    </View>
  );
}
