import { useMemo, useState } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { LogOut, Play, TriangleAlert } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { decodeSharedGamePayload } from "@/features/sharing/sharedGame";
import { useGameStore } from "@/store/gameStore";
import { useThemeColors } from "@/theme/colors";

const sharedGameErrorMessages: Record<string, string> = {
  "Dati partita non validi.": "Shared Sudoku data is invalid.",
  "Versione condivisione non supportata.": "This shared Sudoku version is not supported.",
  "Difficoltà non valida.": "Shared Sudoku difficulty is invalid.",
  "Modalità Arcade non valida.": "Shared Sudoku Arcade mode is invalid.",
  "La griglia deve contenere esattamente 81 celle da 0 a 9.":
    "The grid must contain exactly 81 cells with values from 0 to 9.",
  "La griglia non ha una soluzione unica valida.": "The grid does not have one valid solution.",
  "Link partita non valido.": "Shared Sudoku link is invalid."
};

export default function SharedGameScreen() {
  const [replaceConfirmationVisible, setReplaceConfirmationVisible] = useState(false);
  const params = useLocalSearchParams<{ game?: string | string[] }>();
  const hasHydrated = useGameStore((state) => state.hasHydrated);
  const hasActiveGame = useGameStore(
    (state) => state.puzzle !== null && state.status === "playing"
  );
  const startSharedGame = useGameStore((state) => state.startSharedGame);
  const theme = useThemeColors();
  const encodedGame = Array.isArray(params.game) ? params.game[0] : params.game;
  const decoded = useMemo(
    () =>
      encodedGame
        ? decodeSharedGamePayload(encodedGame)
        : { ok: false as const, error: "Shared Sudoku link does not contain a game." },
    [encodedGame]
  );

  if (!hasHydrated) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen safeArea />
      </>
    );
  }

  const cancel = () => router.replace("/");

  const confirmStart = () => {
    if (!decoded.ok) {
      return;
    }

    setReplaceConfirmationVisible(false);
    if (startSharedGame(decoded.payload)) {
      router.replace("/game");
    }
  };

  const startGame = () => {
    if (hasActiveGame) {
      setReplaceConfirmationVisible(true);
      return;
    }

    confirmStart();
  };

  return (
    <SafeAreaView
      className="flex-1 bg-canvas px-7 py-8"
      style={{ backgroundColor: theme.canvas }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 justify-center gap-8">
        <View className="gap-4">
          <Text
            accessibilityRole="header"
            className="text-center text-4xl font-medium tracking-wide text-ink"
            style={{ color: theme.ink }}
          >
            Shared Sudoku
          </Text>

          {decoded.ok ? (
            <View
              className="gap-4 rounded-lg border border-line bg-panel p-5"
              style={{ backgroundColor: theme.panel, borderColor: theme.line }}
            >
              <PreviewRow label="Difficulty" value={decoded.payload.difficulty} />
              <PreviewRow
                label="Arcade mode"
                value={decoded.payload.arcadeModeEnabled ? "On" : "Off"}
              />
              <PreviewRow
                label="Clues"
                value={String(decoded.payload.givens.flat().filter(Boolean).length)}
              />
            </View>
          ) : (
            <Text
              className="text-center text-base leading-6 text-danger"
              style={{ color: theme.danger }}
            >
              {sharedGameErrorMessages[decoded.error] ?? decoded.error}
            </Text>
          )}
        </View>

        <View className="gap-3">
          {decoded.ok ? (
            <Button
              icon={
                <Play color={theme.accentInk} size={20} strokeWidth={1.9} absoluteStrokeWidth />
              }
              label="Start Game"
              onPress={startGame}
            />
          ) : null}
          <Button
            icon={<LogOut color={theme.ink} size={20} strokeWidth={1.9} absoluteStrokeWidth />}
            label="EXIT"
            onPress={cancel}
            variant="secondary"
          />
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setReplaceConfirmationVisible(false)}
        statusBarTranslucent
        transparent
        visible={replaceConfirmationVisible}
      >
        <View className="flex-1 items-center justify-center px-7">
          <Pressable
            accessibilityLabel="Close confirmation"
            accessibilityRole="button"
            className="absolute inset-0"
            onPress={() => setReplaceConfirmationVisible(false)}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.68)" }}
          />

          <View
            className="w-full max-w-sm gap-6 rounded-xl border border-line bg-panel p-6"
            style={{ backgroundColor: theme.panel, borderColor: theme.line }}
          >
            <View className="items-center gap-4">
              <View
                className="h-12 w-12 items-center justify-center rounded-full bg-dangerSoft"
                style={{ backgroundColor: theme.dangerSoft }}
              >
                <TriangleAlert
                  color={theme.danger}
                  size={24}
                  strokeWidth={1.8}
                  absoluteStrokeWidth
                />
              </View>
              <View className="gap-2">
                <Text
                  accessibilityRole="header"
                  className="text-center text-2xl font-medium text-ink"
                  style={{ color: theme.ink }}
                >
                  Replace current game?
                </Text>
                <Text
                  className="text-center text-sm leading-5 text-muted"
                  style={{ color: theme.muted }}
                >
                  Your current game will be replaced and its local progress will be lost.
                </Text>
              </View>
            </View>

            <View className="gap-3">
              <Button label="Replace" onPress={confirmStart} />
              <Button
                label="Cancel"
                onPress={() => setReplaceConfirmationVisible(false)}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  const theme = useThemeColors();

  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm uppercase tracking-wide text-muted" style={{ color: theme.muted }}>
        {label}
      </Text>
      <Text className="text-base font-medium capitalize text-ink" style={{ color: theme.ink }}>
        {value}
      </Text>
    </View>
  );
}
