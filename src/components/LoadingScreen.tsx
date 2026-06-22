import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColors } from "@/theme/colors";

type LoadingScreenProps = {
  safeArea?: boolean;
};

function LoadingContent() {
  const [activeDot, setActiveDot] = useState(0);
  const theme = useThemeColors();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((dot) => (dot + 1) % 3);
    }, 350);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text
        className="text-center text-base font-medium tracking-wide text-muted"
        style={{ color: theme.muted }}
      >
        Loading
        {[0, 1, 2].map((dot) => (
          <Text
            key={dot}
            className="text-accent"
            style={{ color: theme.accent, opacity: dot <= activeDot ? 1 : 0.25 }}
          >
            .
          </Text>
        ))}
      </Text>
    </View>
  );
}

export function LoadingScreen({ safeArea = false }: LoadingScreenProps) {
  const theme = useThemeColors();

  if (safeArea) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.canvas }}>
        <LoadingContent />
      </SafeAreaView>
    );
  }

  return <LoadingContent />;
}
