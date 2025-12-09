import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../_ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface CallRecord {
  id: string;
  type: "incoming" | "outgoing" | "missed";
  duration: string;
  timestamp: string;
  date: string;
}

export default function CallHistoryScreen() {
  const router = useRouter();
  const { name, phone } = useLocalSearchParams();
  const { theme, isDark } = useTheme();

  const [callHistory] = useState<CallRecord[]>([
    {
      id: "1",
      type: "outgoing",
      duration: "5:32",
      timestamp: "10:30 AM",
      date: "Today",
    },
    {
      id: "2",
      type: "incoming",
      duration: "12:15",
      timestamp: "8:45 AM",
      date: "Today",
    },
    {
      id: "3",
      type: "missed",
      duration: "0:00",
      timestamp: "11:20 PM",
      date: "Yesterday",
    },
    {
      id: "4",
      type: "outgoing",
      duration: "3:45",
      timestamp: "3:15 PM",
      date: "Yesterday",
    },
    {
      id: "5",
      type: "incoming",
      duration: "8:20",
      timestamp: "9:00 AM",
      date: "Dec 2",
    },
    {
      id: "6",
      type: "outgoing",
      duration: "15:48",
      timestamp: "7:30 PM",
      date: "Dec 1",
    },
    {
      id: "7",
      type: "missed",
      duration: "0:00",
      timestamp: "2:45 PM",
      date: "Dec 1",
    },
  ]);

  const getCallIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return "call-outline";
      case "outgoing":
        return "call-outline";
      case "missed":
        return "call-outline";
      default:
        return "call-outline";
    }
  };

  const getCallColor = (type: string) => {
    switch (type) {
      case "incoming":
        return "#34C759";
      case "outgoing":
        return theme.text;
      case "missed":
        return "#FF3B30";
      default:
        return theme.text;
    }
  };

  const getCallLabel = (type: string) => {
    switch (type) {
      case "incoming":
        return "Incoming";
      case "outgoing":
        return "Outgoing";
      case "missed":
        return "Missed";
      default:
        return "Unknown";
    }
  };

  const handleCallPress = (record: CallRecord) => {
    Alert.alert(
      "Call Details",
      `Type: ${getCallLabel(record.type)}\nDuration: ${record.duration}\nTime: ${record.timestamp}\nDate: ${record.date}`,
      [
        { text: "Call Back", onPress: () => Alert.alert("Calling", `Calling ${phone}...`) },
        { text: "Close", style: "cancel" },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all call history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => Alert.alert("Cleared", "Call history has been cleared"),
        },
      ]
    );
  };

  const styles = createStyles(theme, isDark);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: "Call History",
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.accent,
          headerRight: () => (
            <TouchableOpacity onPress={handleDeleteAll} style={{ marginRight: 10 }}>
              <Text style={{ color: theme.accent, fontSize: 16 }}>Clear</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Info Card */}
        <View style={[styles.contactCard, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Text style={styles.avatarText}>
              {name ? (name as string).charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: theme.text }]}>
              {name || "Unknown"}
            </Text>
            <Text style={[styles.contactPhone, { color: theme.secondaryText }]}>
              {phone || "No phone number"}
            </Text>
          </View>
        </View>

        {/* Call History Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.inputBg }]}>
          <View style={styles.statItem}>
            <Ionicons name="call-outline" size={24} color="#34C759" />
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {callHistory.filter((c) => c.type === "incoming").length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              Incoming
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="call-outline" size={24} color={theme.accent} />
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {callHistory.filter((c) => c.type === "outgoing").length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              Outgoing
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="call-outline" size={24} color="#FF3B30" />
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {callHistory.filter((c) => c.type === "missed").length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
              Missed
            </Text>
          </View>
        </View>

        {/* Call History List */}
        <View style={[styles.historySection, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
            RECENT CALLS
          </Text>
          {callHistory.map((record, index) => (
            <TouchableOpacity
              key={record.id}
              style={[
                styles.historyItem,
                {
                  borderBottomColor: theme.itemBorder,
                  borderBottomWidth: index < callHistory.length - 1 ? 1 : 0,
                },
              ]}
              onPress={() => handleCallPress(record)}
            >
              <View
                style={[
                  styles.callIcon,
                  { backgroundColor: `${getCallColor(record.type)}20` },
                ]}
              >
                <Ionicons
                  name={getCallIcon(record.type)}
                  size={20}
                  color={getCallColor(record.type)}
                  style={{
                    transform: [
                      {
                        rotate:
                          record.type === "incoming"
                            ? "135deg"
                            : record.type === "outgoing"
                            ? "-45deg"
                            : "0deg",
                      },
                    ],
                  }}
                />
              </View>
              <View style={styles.callInfo}>
                <Text style={[styles.callType, { color: theme.text }]}>
                  {getCallLabel(record.type)}
                </Text>
                <Text style={[styles.callDate, { color: theme.secondaryText }]}>
                  {record.date} • {record.timestamp}
                </Text>
              </View>
              <View style={styles.callDuration}>
                <Text style={[styles.durationText, { color: theme.text }]}>
                  {record.duration}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.secondaryText}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 20,
      paddingHorizontal: width > 600 ? 40 : 20,
    },
    contactCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    avatarText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 4,
    },
    contactPhone: {
      fontSize: 15,
    },
    statsCard: {
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      flexDirection: "row",
      justifyContent: "space-around",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
    },
    historySection: {
      borderRadius: 12,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      letterSpacing: 0.5,
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    callIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    callInfo: {
      flex: 1,
    },
    callType: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    callDate: {
      fontSize: 13,
    },
    callDuration: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    durationText: {
      fontSize: 15,
      fontWeight: "500",
    },
  });