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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function EditContactScreen() {
  const router = useRouter();
  const { name, phone } = useLocalSearchParams();
  const { theme, isDark } = useTheme();

  const [contactData, setContactData] = useState({
    firstName: (name as string)?.split(" ")[0] || "",
    lastName: (name as string)?.split(" ")[1] || "",
    company: "",
    phoneNumbers: [
      { id: "1", label: "Mobile", number: (phone as string) || "" },
    ],
    emails: [{ id: "1", label: "Home", email: "" }],
    address: "",
    birthday: "",
    notes: "",
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const addPhoneNumber = () => {
    setContactData({
      ...contactData,
      phoneNumbers: [
        ...contactData.phoneNumbers,
        { id: Date.now().toString(), label: "Mobile", number: "" },
      ],
    });
  };

  const updatePhoneNumber = (id: string, field: string, value: string) => {
    setContactData({
      ...contactData,
      phoneNumbers: contactData.phoneNumbers.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const removePhoneNumber = (id: string) => {
    if (contactData.phoneNumbers.length > 1) {
      setContactData({
        ...contactData,
        phoneNumbers: contactData.phoneNumbers.filter((p) => p.id !== id),
      });
    } else {
      Alert.alert("Error", "At least one phone number is required");
    }
  };

  const addEmail = () => {
    setContactData({
      ...contactData,
      emails: [
        ...contactData.emails,
        { id: Date.now().toString(), label: "Home", email: "" },
      ],
    });
  };

  const updateEmail = (id: string, field: string, value: string) => {
    setContactData({
      ...contactData,
      emails: contactData.emails.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    });
  };

  const removeEmail = (id: string) => {
    setContactData({
      ...contactData,
      emails: contactData.emails.filter((e) => e.id !== id),
    });
  };

  const saveContact = () => {
    if (!contactData.firstName && !contactData.lastName) {
      Alert.alert("Error", "Please enter at least a first or last name");
      return;
    }

    if (contactData.phoneNumbers.every((p) => !p.number)) {
      Alert.alert("Error", "Please enter at least one phone number");
      return;
    }

    Alert.alert(
      "Save Contact",
      "Are you sure you want to save these changes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: () => {
            Alert.alert("Success", "Contact saved successfully", [
              { text: "OK", onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const styles = createStyles(theme, isDark);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: "Edit Contact",
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.accent,
          headerRight: () => (
            <TouchableOpacity onPress={saveContact} style={{ marginRight: 10 }}>
              <Text style={{ color: theme.accent, fontSize: 16, fontWeight: "600" }}>
                Save
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              <Text style={styles.avatarText}>
                {contactData.firstName
                  ? contactData.firstName.charAt(0).toUpperCase()
                  : "?"}
              </Text>
            </View>
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={[styles.changePhotoText, { color: theme.accent }]}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={20} color={theme.secondaryText} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="First Name"
                placeholderTextColor={theme.secondaryText}
                value={contactData.firstName}
                onChangeText={(text) =>
                  setContactData({ ...contactData, firstName: text })
                }
              />
            </View>
            <View style={[styles.inputGroup, { borderTopColor: theme.itemBorder }]}>
              <Ionicons name="person-outline" size={20} color={theme.secondaryText} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Last Name"
                placeholderTextColor={theme.secondaryText}
                value={contactData.lastName}
                onChangeText={(text) =>
                  setContactData({ ...contactData, lastName: text })
                }
              />
            </View>
            <View style={[styles.inputGroup, { borderTopColor: theme.itemBorder }]}>
              <Ionicons name="business-outline" size={20} color={theme.secondaryText} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Company"
                placeholderTextColor={theme.secondaryText}
                value={contactData.company}
                onChangeText={(text) =>
                  setContactData({ ...contactData, company: text })
                }
              />
            </View>
          </View>

          {/* Phone Numbers Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
              PHONE NUMBERS
            </Text>
            {contactData.phoneNumbers.map((phoneItem, index) => (
              <View key={phoneItem.id}>
                <View
                  style={[
                    styles.inputGroup,
                    index > 0 && { borderTopColor: theme.itemBorder },
                  ]}
                >
                  <Ionicons name="call-outline" size={20} color={theme.secondaryText} />
                  <View style={styles.multiInputContainer}>
                    <TextInput
                      style={[styles.labelInput, { color: theme.text }]}
                      placeholder="Label"
                      placeholderTextColor={theme.secondaryText}
                      value={phoneItem.label}
                      onChangeText={(text) =>
                        updatePhoneNumber(phoneItem.id, "label", text)
                      }
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Phone Number"
                      placeholderTextColor={theme.secondaryText}
                      keyboardType="phone-pad"
                      value={phoneItem.number}
                      onChangeText={(text) =>
                        updatePhoneNumber(phoneItem.id, "number", text)
                      }
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => removePhoneNumber(phoneItem.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addPhoneNumber}>
              <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
              <Text style={[styles.addButtonText, { color: theme.accent }]}>
                Add Phone Number
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
              EMAIL ADDRESSES
            </Text>
            {contactData.emails.map((emailItem, index) => (
              <View key={emailItem.id}>
                <View
                  style={[
                    styles.inputGroup,
                    index > 0 && { borderTopColor: theme.itemBorder },
                  ]}
                >
                  <Ionicons name="mail-outline" size={20} color={theme.secondaryText} />
                  <View style={styles.multiInputContainer}>
                    <TextInput
                      style={[styles.labelInput, { color: theme.text }]}
                      placeholder="Label"
                      placeholderTextColor={theme.secondaryText}
                      value={emailItem.label}
                      onChangeText={(text) =>
                        updateEmail(emailItem.id, "label", text)
                      }
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Email Address"
                      placeholderTextColor={theme.secondaryText}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={emailItem.email}
                      onChangeText={(text) =>
                        updateEmail(emailItem.id, "email", text)
                      }
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => removeEmail(emailItem.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addEmail}>
              <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
              <Text style={[styles.addButtonText, { color: theme.accent }]}>
                Add Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <View style={styles.inputGroup}>
              <Ionicons name="location-outline" size={20} color={theme.secondaryText} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Address"
                placeholderTextColor={theme.secondaryText}
                value={contactData.address}
                onChangeText={(text) =>
                  setContactData({ ...contactData, address: text })
                }
              />
            </View>
            <View style={[styles.inputGroup, { borderTopColor: theme.itemBorder }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.secondaryText} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Birthday (MM/DD/YYYY)"
                placeholderTextColor={theme.secondaryText}
                value={contactData.birthday}
                onChangeText={(text) =>
                  setContactData({ ...contactData, birthday: text })
                }
              />
            </View>
          </View>

          {/* Notes Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <View style={styles.inputGroup}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={theme.secondaryText}
              />
              <TextInput
                style={[styles.input, styles.notesInput, { color: theme.text }]}
                placeholder="Notes"
                placeholderTextColor={theme.secondaryText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={contactData.notes}
                onChangeText={(text) =>
                  setContactData({ ...contactData, notes: text })
                }
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accent }]}
            onPress={saveContact}
          >
            <Text style={styles.saveButtonText}>Save Contact</Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    avatarSection: {
      alignItems: "center",
      marginBottom: 30,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    avatarText: {
      color: "#fff",
      fontSize: 42,
      fontWeight: "bold",
    },
    changePhotoButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    changePhotoText: {
      fontSize: 16,
      fontWeight: "600",
    },
    section: {
      borderRadius: 12,
      marginBottom: 20,
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
      paddingBottom: 8,
      letterSpacing: 0.5,
    },
    inputGroup: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: "transparent",
    },
    input: {
      flex: 1,
      fontSize: 16,
      marginLeft: 12,
      paddingVertical: 8,
    },
    multiInputContainer: {
      flex: 1,
      marginLeft: 12,
    },
    labelInput: {
      fontSize: 14,
      marginBottom: 4,
      fontWeight: "500",
    },
    notesInput: {
      minHeight: 80,
    },
    removeButton: {
      padding: 4,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 8,
    },
    saveButton: {
      borderRadius: 12,
      padding: 16,
      marginTop: 10,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
  }); 