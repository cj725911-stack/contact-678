import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../_ThemeContext";
import { ContactsProvider } from "../_ContactsContext";

export default function TabsLayout() {
  const { theme, isDark } = useTheme();

  return (
    <ContactsProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.inputBg,
            borderTopColor: theme.itemBorder,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.secondaryText,
        }}
      >
        <Tabs.Screen
          name="keypad"
          options={{
            title: "Keypad",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="keypad" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recents"
          options={{
            title: "Recents",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Contacts",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ContactsProvider>
  );
}