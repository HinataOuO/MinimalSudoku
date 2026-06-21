import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoadingScreenProps = {
  safeArea?: boolean;
};

function LoadingContent() {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((dot) => (dot + 1) % 3);
    }, 350);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-center text-base font-medium tracking-wide text-muted">
        Loading
        {[0, 1, 2].map((dot) => (
          <Text key={dot} className="text-accent" style={{ opacity: dot <= activeDot ? 1 : 0.25 }}>
            .
          </Text>
        ))}
      </Text>
    </View>
  );
}

export function LoadingScreen({ safeArea = false }: LoadingScreenProps) {
  if (safeArea) {
    return (
      <SafeAreaView className="flex-1">
        <LoadingContent />
      </SafeAreaView>
    );
  }

  return <LoadingContent />;
}
