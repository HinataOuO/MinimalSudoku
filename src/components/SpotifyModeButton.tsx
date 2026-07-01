import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { Music } from "lucide-react-native";

import { useSound } from "@/audio/SoundProvider";
import { useThemeColors } from "@/theme/colors";

export function SpotifyModeButton() {
  const { spotifyModeEnabled, toggleSpotifyMode } = useSound();
  const theme = useThemeColors();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spotifyModeEnabled) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 900,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          duration: 900,
          toValue: 0,
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse, spotifyModeEnabled]);

  return (
    <Pressable
      accessibilityLabel="Toggle Spotify mode"
      accessibilityRole="button"
      accessibilityState={{ selected: spotifyModeEnabled }}
      hitSlop={8}
      onPress={toggleSpotifyMode}
      className="h-10 w-10 items-center justify-center rounded-md border border-line bg-transparent active:opacity-75"
      style={{ borderColor: theme.line }}
      testID="spotify-mode-toggle"
    >
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          opacity: spotifyModeEnabled
            ? pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.62, 1]
              })
            : 1,
          transform: [
            {
              scale: spotifyModeEnabled
                ? pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1.08]
                  })
                : 1
            }
          ]
        }}
      >
        <Music
          color={spotifyModeEnabled ? theme.accent : theme.muted}
          size={20}
          strokeWidth={1.8}
          absoluteStrokeWidth
        />
      </Animated.View>
    </Pressable>
  );
}
