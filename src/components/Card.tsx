import { PropsWithChildren } from "react";
import { View } from "react-native";

export function Card({ children }: PropsWithChildren) {
  return <View className="rounded-lg border border-line bg-panel p-4">{children}</View>;
}
