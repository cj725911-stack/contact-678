import { Stack } from 'expo-router';
import { ThemeProvider } from './ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="addContact" />
        <Stack.Screen name="call" />
        <Stack.Screen name="settings" />
      </Stack>
    </ThemeProvider>
  );
}