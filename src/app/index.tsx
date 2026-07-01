import { Link, router, Stack, type Href } from "expo-router";
import { Grid3X3, Play, Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSound } from "@/audio/SoundProvider";
import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SpotifyModeButton } from "@/components/SpotifyModeButton";
import { useGameStore } from "@/store/gameStore";
import { useThemeColors } from "@/theme/colors";

export default function HomeScreen() {
  const hasHydrated = useGameStore((state) => state.hasHydrated);
  const hasGame = useGameStore((state) => state.puzzle !== null && state.status === "playing");
  const { playUiClick } = useSound();
  const theme = useThemeColors();

  if (!hasHydrated) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen safeArea />
      </>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas px-7 pt-4" style={{ backgroundColor: theme.canvas }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="h-11 flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            playUiClick();
            router.push("/settings" as Href);
          }}
          className="h-10 w-10 items-center justify-center rounded-md border border-line bg-transparent active:opacity-75"
          style={{ borderColor: theme.line }}
        >
          <Settings color={theme.muted} size={20} strokeWidth={1.8} absoluteStrokeWidth />
        </Pressable>
        <SpotifyModeButton />
      </View>

      <View className="flex-1 justify-center gap-10">
        <View className="items-center gap-4">
          <Text
            className="text-center text-5xl font-medium tracking-wide text-ink"
            style={{ color: theme.ink }}
          >
            Minimal Sudoku
          </Text>
          <Text
            className="max-w-sm text-center text-lg leading-7 text-muted"
            style={{ color: theme.muted }}
          >
            Clean offline puzzles. Choose a difficulty, solve the grid, come back anytime.
          </Text>
        </View>

        <View className="gap-4">
          <Link href="/difficulty" asChild>
            <Button
              icon={
                <Grid3X3 color={theme.accentInk} size={20} strokeWidth={1.9} absoluteStrokeWidth />
              }
              label="New Game"
            />
          </Link>
          {hasGame ? (
            <Link href="/game" asChild>
              <Button
                icon={
                  <Play color={theme.ink} size={20} strokeWidth={1.9} absoluteStrokeWidth />
                }
                label="Continue"
                variant="secondary"
              />
            </Link>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
