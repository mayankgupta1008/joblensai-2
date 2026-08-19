import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background">
      <Text className="text-2xl font-semibold text-foreground">JobLens</Text>
      <Text className="text-sm text-muted-foreground">Uniwind is wired up</Text>
    </View>
  );
}
