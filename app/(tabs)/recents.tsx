import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../_ThemeContext";
import CallLogs from "react-native-call-log";
import { Linking } from "react-native";
import * as Contacts from "expo-contacts";

export default function Recents() {
  const { theme } = useTheme();
  const [callHistory, setCallHistory] = useState<any[]>([]);

  useEffect(() => {
    loadCallLogs();
  }, []);

  const loadCallLogs = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted" && Platform.OS === "android") {
        const logs = await CallLogs.load(50); // Load last 50 calls
        setCallHistory(logs);
      }
    } catch (error) {
      console.error("Error loading call logs:", error);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case "OUTGOING":
        return { name: "call-outline", color: theme.accent };
      case "INCOMING":
        return { name: "call-outline", color: theme.accent };
      case "MISSED":
        return { name: "call-outline", color: "#ff3b30" };
      default:
        return { name: "call-outline", color: theme.secondaryText };
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const renderCallItem = ({ item }: { item: any }) => {
    const icon = getCallIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.callItem, { borderBottomColor: theme.itemBorder }]}
        onPress={() => handleCall(item.phoneNumber)}
      >
        <Ionicons name={icon.name as any} size={20} color={icon.color} />
        
        <View style={styles.callInfo}>
          <Text style={[styles.name, { color: theme.text }]}>
            {item.name || item.phoneNumber}
          </Text>
          <Text style={[styles.details, { color: theme.secondaryText }]}>
            {item.type.toLowerCase()} • {formatDate(item.timestamp)}
          </Text>
        </View>

        <TouchableOpacity onPress={() => handleCall(item.phoneNumber)}>
          <Ionicons name="information-circle-outline" size={24} color={theme.accent} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.itemBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Recents</Text>
      </View>

      {callHistory.length > 0 ? (
        <FlatList
          data={callHistory}
          renderItem={renderCallItem}
          keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            No recent calls
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
  },
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  callInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    marginBottom: 2,
  },
  details: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});