import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import { Coffee, GitBranch, Home, UserRound } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSound } from "@/audio/SoundProvider";
import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

const repositoryUrl = "https://github.com/HinataOuO/MinimalSudoku";

const audioPresets = [
  {
    accessibilityLabel: "Mute audio",
    label: "Mute",
    muted: true,
    volume: 0
  },
  {
    accessibilityLabel: "Set volume to low",
    label: "Low",
    muted: false,
    volume: 0.1
  },
  {
    accessibilityLabel: "Set volume to medium",
    label: "Medium",
    muted: false,
    volume: 0.5
  },
  {
    accessibilityLabel: "Set volume to high",
    label: "High",
    muted: false,
    volume: 1
  }
] as const;

export default function SettingsScreen() {
  const { playUiClick } = useSound();

  return (
    <SafeAreaView className="flex-1 bg-canvas px-7 pb-8 pt-4">
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
        >
          <Home color={colors.muted} size={20} strokeWidth={1.8} absoluteStrokeWidth />
        </Pressable>
      </View>

      <View className="flex-1 justify-center gap-9">
        <View className="gap-3">
          <Text className="text-4xl font-medium tracking-wide text-ink">Settings</Text>
          <Text className="max-w-sm text-base leading-6 text-muted">
            Audio, support, and project links.
          </Text>
        </View>

        <AudioSettings />
        <DonationSettings />
        <DeveloperSettings />
      </View>
    </SafeAreaView>
  );
}

function AudioSettings() {
  const { muted, setVolume, volume } = useSound();

  return (
    <View className="gap-4 rounded-md border border-line bg-panel p-5">
      <Text className="text-sm font-medium uppercase tracking-wide text-muted">Audio</Text>
      <View className="h-11 flex-row overflow-hidden rounded-md border border-line bg-panelElevated">
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
              }}
              className={`flex-1 items-center justify-center active:opacity-75 ${
                preset.label === "Mute" ? "" : "border-l border-line"
              } ${isSelected ? "bg-accent" : "bg-transparent"}`}
            >
              <Text
                className={`text-xs font-medium tracking-wide ${
                  isSelected ? "text-accentInk" : "text-muted"
                }`}
                numberOfLines={1}
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
  return (
    <View className="gap-4 rounded-md border border-line bg-panel p-5">
      <Text className="text-sm font-medium uppercase tracking-wide text-muted">Support</Text>
      <Button
        disabled
        icon={<Coffee color={colors.accentInk} size={20} strokeWidth={1.9} absoluteStrokeWidth />}
        label="Buy me a coffee"
      />
      <Text className="text-sm leading-5 text-muted">
        Donation link not configured yet.
      </Text>
    </View>
  );
}

function DeveloperSettings() {
  return (
    <View className="gap-4 rounded-md border border-line bg-panel p-5">
      <Text className="text-sm font-medium uppercase tracking-wide text-muted">Developer</Text>

      <View className="flex-row items-center gap-3">
        <UserRound color={colors.muted} size={18} strokeWidth={1.8} absoluteStrokeWidth />
        <Text className="text-base text-ink">HinataOuO</Text>
      </View>

      <Pressable
        accessibilityLabel="Open GitHub repository"
        accessibilityRole="link"
        hitSlop={8}
        onPress={() => {
          void Linking.openURL(repositoryUrl);
        }}
        className="flex-row items-center gap-3 rounded-md border border-line px-4 py-3 active:opacity-75"
      >
        <GitBranch color={colors.muted} size={18} strokeWidth={1.8} absoluteStrokeWidth />
        <Text className="flex-1 text-base text-ink">GitHub repository</Text>
      </Pressable>
    </View>
  );
}
