import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false, // 👈 hides headers globally
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="call" />
      <Stack.Screen name="addContact" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
