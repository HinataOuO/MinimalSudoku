import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

import { useSound } from "@/audio/SoundProvider";
import { useThemeColors } from "@/theme/colors";

type DeveloperSplashScreenProps = {
  onFinish: () => void;
};

const splashDurationMs = 5000;
const introDelayMs = 1500;
const introDurationMs = 2000;
const logoLetters = [
  {
    inputRange: [0, 0.12, 0.24, 0.38, 1],
    outputRange: [0, -10, 4, 0, 0],
    rotate: ["0deg", "-4deg", "2deg", "0deg", "0deg"]
  },
  {
    inputRange: [0, 0.18, 0.32, 0.48, 1],
    outputRange: [0, -14, 6, 0, 0],
    rotate: ["0deg", "3deg", "-2deg", "0deg", "0deg"]
  },
  {
    inputRange: [0, 0.24, 0.38, 0.56, 1],
    outputRange: [0, -10, 4, 0, 0],
    rotate: ["0deg", "-4deg", "2deg", "0deg", "0deg"]
  }
];

export function DeveloperSplashScreen({ onFinish }: DeveloperSplashScreenProps) {
  const { playIntro } = useSound();
  const theme = useThemeColors();
  const introProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const introTimer = setTimeout(() => {
      playIntro();
      Animated.timing(introProgress, {
        duration: introDurationMs,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true
      }).start();
    }, introDelayMs);

    const finishTimer = setTimeout(onFinish, splashDurationMs);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(finishTimer);
      introProgress.stopAnimation();
    };
  }, [introProgress, onFinish, playIntro]);

  return (
    <View
      className="absolute inset-0 z-50 items-center justify-center"
      style={{ backgroundColor: theme.canvas }}
      testID="developer-splash"
    >
      <Animated.View
        className="items-center justify-center"
        style={{
          transform: [
            {
              scale: introProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1.35, 1]
              })
            }
          ]
        }}
      >
        <View
          accessibilityLabel="Developer logo OuO"
          accessible
          className="flex-row items-center px-4"
        >
          {["O", "u", "O"].map((letter, index) => (
            <Animated.Text
              key={`${letter}-${index}`}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              className="text-center"
              style={{
                color: theme.ink,
                fontSize: 110,
                fontWeight: "900",
                lineHeight: 116,
                marginHorizontal: 2.75,
                transform: [
                  {
                    translateY: introProgress.interpolate({
                      inputRange: logoLetters[index].inputRange,
                      outputRange: logoLetters[index].outputRange
                    })
                  },
                  {
                    rotate: introProgress.interpolate({
                      inputRange: logoLetters[index].inputRange,
                      outputRange: logoLetters[index].rotate
                    })
                  }
                ]
              }}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
