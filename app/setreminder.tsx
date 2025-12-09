import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../_ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  enabled: boolean;
  repeat: string;
}

export default function ReminderScreen() {
  const router = useRouter();
  const { name, phone } = useLocalSearchParams();
  const { theme, isDark } = useTheme();

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: "1",
      title: "Call back about meeting",
      date: "2024-12-05",
      time: "14:00",
      enabled: true,
      repeat: "Never",
    },
    {
      id: "2",
      title: "Weekly check-in call",
      date: "2024-12-08",
      time: "10:00",
      enabled: true,
      repeat: "Weekly",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    date: "",
    time: "",
    repeat: "Never",
  });

  const addReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      date: newReminder.date,
      time: newReminder.time,
      enabled: true,
      repeat: newReminder.repeat,
    };

    setReminders([reminder, ...reminders]);
    setNewReminder({ title: "", date: "", time: "", repeat: "Never" });
    setShowAddModal(false);
    Alert.alert("Success", "Reminder added successfully");
  };

  const toggleReminder = (id: string) => {
    setReminders(
      reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteReminder = (id: string) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setReminders(reminders.filter((r) => r.id !== id));
            Alert.alert("Deleted", "Reminder deleted successfully");
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const styles = createStyles(theme, isDark);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: "Reminders",
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.accent,
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Info Card */}
        <View style={[styles.contactCard, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Ionicons name="notifications" size={32} color="#fff" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactLabel, { color: theme.secondaryText }]}>
              Set reminders for
            </Text>
            <Text style={[styles.contactName, { color: theme.text }]}>
              {name || "Unknown"}
            </Text>
            <Text style={[styles.contactPhone, { color: theme.secondaryText }]}>
              {phone || "No phone number"}
            </Text>
          </View>
        </View>

        {/* Add Reminder Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Reminder</Text>
        </TouchableOpacity>

        {/* Reminders List */}
        <View style={[styles.remindersSection, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
            YOUR REMINDERS ({reminders.length})
          </Text>
          {reminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={theme.secondaryText}
              />
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                No reminders set
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
                Tap the button above to add your first reminder
              </Text>
            </View>
          ) : (
            reminders.map((reminder, index) => (
              <View
                key={reminder.id}
                style={[
                  styles.reminderItem,
                  {
                    borderBottomColor: theme.itemBorder,
                    borderBottomWidth: index < reminders.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    {
                      borderColor: reminder.enabled ? theme.accent : theme.border,
                      backgroundColor: reminder.enabled ? theme.accent : "transparent",
                    },
                  ]}
                  onPress={() => toggleReminder(reminder.id)}
                >
                  {reminder.enabled && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>

                <View style={styles.reminderContent}>
                  <Text
                    style={[
                      styles.reminderTitle,
                      {
                        color: theme.text,
                        opacity: reminder.enabled ? 1 : 0.5,
                      },
                    ]}
                  >
                    {reminder.title}
                  </Text>
                  <View style={styles.reminderDetails}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={theme.secondaryText}
                    />
                    <Text style={[styles.reminderDate, { color: theme.secondaryText }]}>
                      {formatDate(reminder.date)} at {reminder.time}
                    </Text>
                  </View>
                  {reminder.repeat !== "Never" && (
                    <View style={styles.reminderDetails}>
                      <Ionicons
                        name="repeat-outline"
                        size={14}
                        color={theme.secondaryText}
                      />
                      <Text
                        style={[styles.reminderRepeat, { color: theme.secondaryText }]}
                      >
                        {reminder.repeat}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteReminder(reminder.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.inputBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                New Reminder
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g., Call back about meeting"
                placeholderTextColor={theme.secondaryText}
                value={newReminder.title}
                onChangeText={(text) =>
                  setNewReminder({ ...newReminder, title: text })
                }
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Date</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="YYYY-MM-DD (e.g., 2024-12-05)"
                placeholderTextColor={theme.secondaryText}
                value={newReminder.date}
                onChangeText={(text) =>
                  setNewReminder({ ...newReminder, date: text })
                }
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Time</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="HH:MM (e.g., 14:30)"
                placeholderTextColor={theme.secondaryText}
                value={newReminder.time}
                onChangeText={(text) =>
                  setNewReminder({ ...newReminder, time: text })
                }
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Repeat</Text>
              <View style={styles.repeatOptions}>
                {["Never", "Daily", "Weekly", "Monthly"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.repeatOption,
                      {
                        backgroundColor:
                          newReminder.repeat === option
                            ? theme.accent
                            : theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() =>
                      setNewReminder({ ...newReminder, repeat: option })
                    }
                  >
                    <Text
                      style={[
                        styles.repeatOptionText,
                        {
                          color:
                            newReminder.repeat === option ? "#fff" : theme.text,
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={addReminder}
              >
                <Text style={styles.saveButtonText}>Save Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    contactInfo: {
      flex: 1,
    },
    contactLabel: {
      fontSize: 13,
      marginBottom: 4,
    },
    contactName: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 4,
    },
    contactPhone: {
      fontSize: 14,
    },
    addButton: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    remindersSection: {
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
    emptyState: {
      paddingVertical: 60,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: "center",
      paddingHorizontal: 40,
    },
    reminderItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    reminderContent: {
      flex: 1,
    },
    reminderTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 6,
    },
    reminderDetails: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    reminderDate: {
      fontSize: 13,
      marginLeft: 6,
    },
    reminderRepeat: {
      fontSize: 13,
      marginLeft: 6,
    },
    deleteButton: {
      padding: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0, 0, 0, 0.1)",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    modalBody: {
      padding: 20,
    },
    inputLabel: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    repeatOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    repeatOption: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
    },
    repeatOptionText: {
      fontSize: 14,
      fontWeight: "500",
    },
    modalFooter: {
      flexDirection: "row",
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: "rgba(0, 0, 0, 0.1)",
    },
    modalButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  }); 