import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { useSound } from "@/audio/SoundProvider";
import { useThemeColors } from "@/theme/colors";

type DeveloperSplashScreenProps = {
  onFinish: () => void;
};

const splashDurationMs = 5000;

export function DeveloperSplashScreen({ onFinish }: DeveloperSplashScreenProps) {
  const { playIntro } = useSound();
  const theme = useThemeColors();
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    playIntro();
    Animated.timing(sweep, {
      duration: splashDurationMs,
      easing: Easing.inOut(Easing.cubic),
      toValue: 1,
      useNativeDriver: true
    }).start();

    const finishTimer = setTimeout(onFinish, splashDurationMs);

    return () => {
      clearTimeout(finishTimer);
      sweep.stopAnimation();
    };
  }, [onFinish, playIntro, sweep]);

  return (
    <View
      className="absolute inset-0 z-50 items-center justify-center"
      style={{ backgroundColor: theme.canvas }}
      testID="developer-splash"
    >
      <View className="items-center justify-center">
        <View className="items-center overflow-hidden px-4">
          <Text
            accessibilityLabel="Developer logo OuO"
            className="text-center"
            style={{
              color: theme.ink,
              fontSize: 110,
              fontWeight: "900",
              letterSpacing: 5.5,
              lineHeight: 116
            }}
          >
            OuO
          </Text>
          <Animated.View
            accessibilityElementsHidden
            className="absolute bottom-3 top-2 w-14"
            importantForAccessibility="no-hide-descendants"
            style={{
              backgroundColor: "#FFFFFF",
              opacity: sweep.interpolate({
                inputRange: [0, 0.38, 0.5, 0.62, 1],
                outputRange: [0, 0.08, 0.88, 0.08, 0]
              }),
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 0.55, 1],
                    outputRange: [180, -40, -70]
                  })
                },
                { rotate: "15deg" },
                { scaleY: 1.7 }
              ]
            }}
          />
          <Animated.Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute text-center"
            style={{
              color: "#FFFFFF",
              fontSize: 110,
              fontWeight: "900",
              letterSpacing: 5.5,
              lineHeight: 116,
              opacity: sweep.interpolate({
                inputRange: [0, 0.38, 0.5, 0.62, 1],
                outputRange: [0, 0.04, 0.24, 0.04, 0]
              })
            }}
          >
            OuO
          </Animated.Text>
        </View>

        <View className="mt-1 h-0.5 w-full overflow-hidden" style={{ backgroundColor: `${theme.ink}1A` }}>
          <Animated.View
            accessibilityElementsHidden
            className="h-0.5 w-1/2"
            importantForAccessibility="no-hide-descendants"
            style={{
              backgroundColor: theme.ink,
              opacity: 0.72,
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 0.55, 1],
                    outputRange: [180, -20, -70]
                  })
                }
              ]
            }}
          />
        </View>
      </View>
    </View>
  );
}
