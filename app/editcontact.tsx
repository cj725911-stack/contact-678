import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../_ThemeContext";
import * as Contacts from "expo-contacts";



const { width } = Dimensions.get("window");

export default function EditContactScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const params = useLocalSearchParams();

  const [contactData, setContactData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phoneNumbers: [{ id: "1", label: "mobile", number: "" }],
    emails: [{ id: "1", label: "home", email: "" }],
    address: "",
    birthday: "",
    notes: "",
  });

  const saveContact = async () => {
    if (!contactData.firstName && !contactData.lastName) {
      Alert.alert("Error", "Please enter at least a first or last name");
      return;
    }

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Cannot save contact without permission");
        return;
      }

      const contact = {
        [Contacts.Fields.FirstName]: contactData.firstName,
        [Contacts.Fields.LastName]: contactData.lastName,
        [Contacts.Fields.Company]: contactData.company,
        [Contacts.Fields.PhoneNumbers]: contactData.phoneNumbers
          .filter((p) => p.number)
          .map((p) => ({
            label: p.label,
            number: p.number,
          })),
        [Contacts.Fields.Emails]: contactData.emails
          .filter((e) => e.email)
          .map((e) => ({
            label: e.label,
            email: e.email,
          })),
        [Contacts.Fields.Addresses]: contactData.address
          ? [{ label: "home", street: contactData.address }]
          : [],
        [Contacts.Fields.Note]: contactData.notes,
      };

      await Contacts.addContactAsync(contact);
      Alert.alert("Success", "Contact saved successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save contact");
      console.error(error);
    }
  };

  const addPhoneNumber = () => {
    const newId = String(Date.now());
    setContactData({
      ...contactData,
      phoneNumbers: [
        ...contactData.phoneNumbers,
        { id: newId, label: "mobile", number: "" },
      ],
    });
  };

  const removePhoneNumber = (id: string) => {
    if (contactData.phoneNumbers.length === 1) {
      Alert.alert("Error", "At least one phone number field is required");
      return;
    }
    setContactData({
      ...contactData,
      phoneNumbers: contactData.phoneNumbers.filter((p) => p.id !== id),
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

  const addEmail = () => {
    const newId = String(Date.now());
    setContactData({
      ...contactData,
      emails: [...contactData.emails, { id: newId, label: "home", email: "" }],
    });
  };

  const removeEmail = (id: string) => {
    if (contactData.emails.length === 1) {
      Alert.alert("Error", "At least one email field is required");
      return;
    }
    setContactData({
      ...contactData,
      emails: contactData.emails.filter((e) => e.id !== id),
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: "Add Contact",
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
            <View style={[styles.inputGroup, { borderTopColor: theme.itemBorder, borderTopWidth: 1 }]}>
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
            <View style={[styles.inputGroup, { borderTopColor: theme.itemBorder, borderTopWidth: 1 }]}>
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
                    index > 0 && { borderTopColor: theme.itemBorder, borderTopWidth: 1 },
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
                  {contactData.phoneNumbers.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removePhoneNumber(phoneItem.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
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
                    index > 0 && { borderTopColor: theme.itemBorder, borderTopWidth: 1 },
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
                  {contactData.emails.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeEmail(emailItem.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
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
            <View style={[styles.inputGroup, { borderTopColor: theme.itemBorder, borderTopWidth: 1 }]}>
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

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  changePhotoButton: {
    paddingVertical: 8,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    marginHorizontal: width > 600 ? 40 : 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    textTransform: "uppercase",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    paddingVertical: 8,
  },
  labelInput: {
    fontSize: 14,
    marginBottom: 6,
  },
  multiInputContainer: {
    flex: 1,
    marginLeft: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  saveButton: {
    marginHorizontal: width > 600 ? 40 : 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});