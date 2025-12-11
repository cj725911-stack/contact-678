import { Stack } from "expo-router";
import { ThemeProvider } from "../_ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="addContact" 
          options={{ 
            presentation: "modal",
            headerShown: false,
            title: "Add Contact"
          }} 
        />
        <Stack.Screen name="call" options={{ headerShown: false }} />
        <Stack.Screen name="callhistory" options={{ headerShown: false }} />
        <Stack.Screen name="setreminder" options={{ headerShown: false}} />
        <Stack.Screen name="notes" options={{ headerShown: false }} />
        <Stack.Screen name="editcontact" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}                