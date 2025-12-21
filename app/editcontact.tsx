import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../_ThemeContext";

export default function EditContactScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const contactId = params.id as string;

  const [contactData, setContactData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phoneNumbers: [{ id: "1", label: "mobile", number: "" }],
    emails: [{ id: "1", label: "home", email: "" }],
    addresses: [{ id: "1", label: "home", street: "", city: "", state: "", postalCode: "" }],
    birthday: "",
    notes: "",
    imageUri: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalContact, setOriginalContact] = useState(null);

  useEffect(() => {
    if (contactId) {
      loadContact();
    } else {
      setLoading(false);
    }
  }, [contactId]);

  const loadContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Cannot load contact without permission");
        router.back();
        return;
      }

      const contact = await Contacts.getContactByIdAsync(contactId);
      
      if (contact) {
        console.log("Loaded contact:", JSON.stringify(contact, null, 2));
        setOriginalContact(contact);

        // Parse birthday
        let birthdayString = "";
        if (contact.birthday) {
          const { month, day, year } = contact.birthday;
          const m = month?.toString().padStart(2, '0') || '01';
          const d = day?.toString().padStart(2, '0') || '01';
          const y = year || new Date().getFullYear();
          birthdayString = `${m}/${d}/${y}`;
        }

        // Parse addresses
        let addressesArray = [{ id: "1", label: "home", street: "", city: "", state: "", postalCode: "" }];
        if (contact.addresses && contact.addresses.length > 0) {
          addressesArray = contact.addresses.map((addr, index) => ({
            id: String(index + 1),
            label: addr.label || "home",
            street: addr.street || "",
            city: addr.city || "",
            state: addr.region || "",
            postalCode: addr.postalCode || "",
          }));
        }

        const imageUri = contact.image?.uri || "";

        setContactData({
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          company: contact.company || "",
          phoneNumbers:
            contact.phoneNumbers && contact.phoneNumbers.length > 0
              ? contact.phoneNumbers.map((p, index) => ({
                  id: String(index + 1),
                  label: p.label || "mobile",
                  number: p.number || "",
                }))
              : [{ id: "1", label: "mobile", number: "" }],
          emails:
            contact.emails && contact.emails.length > 0
              ? contact.emails.map((e, index) => ({
                  id: String(index + 1),
                  label: e.label || "home",
                  email: e.email || "",
                }))
              : [{ id: "1", label: "home", email: "" }],
          addresses: addressesArray,
          birthday: birthdayString,
          notes: contact.note || "",
          imageUri: imageUri,
        });
      } else {
        Alert.alert("Error", "Contact not found");
        router.back();
      }
    } catch (error) {
      console.error("Error loading contact:", error);
      Alert.alert("Error", "Failed to load contact");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const resizedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setContactData({ ...contactData, imageUri: resizedImage.uri });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removeImage = () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setContactData({ ...contactData, imageUri: "" });
          },
        },
      ]
    );
  };

  const saveContact = async () => {
    // Validation
    if (!contactData.firstName.trim() && !contactData.lastName.trim()) {
      Alert.alert("Error", "Please enter at least a first or last name");
      return;
    }

    const hasPhone = contactData.phoneNumbers.some(p => p.number.trim() !== "");
    if (!hasPhone) {
      Alert.alert("Error", "Please enter at least one phone number");
      return;
    }

    setSaving(true);

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Cannot save contact without permission");
        setSaving(false);
        return;
      }

      // Build contact object - using direct properties
      const contact: any = {
        id: contactId,
        firstName: contactData.firstName.trim(),
        lastName: contactData.lastName.trim(),
      };

      // Add company
      if (contactData.company?.trim()) {
        contact.company = contactData.company.trim();
      }

      // Phone numbers - filter and format
      const validPhones = contactData.phoneNumbers
        .filter((p) => p.number?.trim())
        .map((p) => ({
          label: p.label?.trim() || "mobile",
          number: p.number.trim(),
        }));
      
      if (validPhones.length > 0) {
        contact.phoneNumbers = validPhones;
      }

      // Emails - filter and format
      const validEmails = contactData.emails
        .filter((e) => e.email?.trim())
        .map((e) => ({
          label: e.label?.trim() || "home",
          email: e.email.trim(),
        }));
      
      if (validEmails.length > 0) {
        contact.emails = validEmails;
      }

      // Addresses - filter and format
      const validAddresses = contactData.addresses
        .filter((a) => 
          a.street?.trim() || a.city?.trim() || a.state?.trim() || a.postalCode?.trim()
        )
        .map((a) => ({
          label: a.label?.trim() || "home",
          street: a.street?.trim() || "",
          city: a.city?.trim() || "",
          region: a.state?.trim() || "",
          postalCode: a.postalCode?.trim() || "",
          country: "",
        }));
      
      if (validAddresses.length > 0) {
        contact.addresses = validAddresses;
      }

      // Birthday - parse and validate
      if (contactData.birthday?.trim()) {
        const parts = contactData.birthday.split("/");
        if (parts.length === 3) {
          const month = parseInt(parts[0]);
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          
          if (!isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            contact.birthday = { 
              month, 
              day, 
              year: (!isNaN(year) && year > 1900) ? year : undefined,
            };
          }
        }
      }

      // Notes
      if (contactData.notes?.trim()) {
        contact.note = contactData.notes.trim();
      }

      // Image - only if changed
      if (contactData.imageUri && contactData.imageUri !== originalContact?.image?.uri) {
        contact.image = { uri: contactData.imageUri };
      }

      console.log("=== SAVING CONTACT ===");
      console.log("Contact ID:", contactId);
      console.log("Platform:", Platform.OS);
      
      // Save the contact
      await Contacts.updateContactAsync(contact);
      
      Alert.alert("Success", "Contact updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("=== ERROR SAVING CONTACT ===");
      console.error("Error:", error);
      
      Alert.alert(
        "Error", 
        `Failed to save contact: ${error?.message || "Unknown error"}`,
        [{ text: "OK" }]
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = () => {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { status } = await Contacts.requestPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Permission Denied", "Cannot delete contact without permission");
                return;
              }

              await Contacts.removeContactAsync(contactId);
              Alert.alert("Success", "Contact deleted successfully", [
                { text: "OK", onPress: () => router.replace("/") }
              ]);
            } catch (error) {
              console.error("Error deleting contact:", error);
              Alert.alert("Error", "Failed to delete contact");
            }
          },
        },
      ]
    );
  };

  // Phone number functions
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

  // Email functions
  const addEmail = () => {
    const newId = String(Date.now());
    setContactData({
      ...contactData,
      emails: [...contactData.emails, { id: newId, label: "home", email: "" }],
    });
  };

  const removeEmail = (id: string) => {
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

  // Address functions
  const addAddress = () => {
    const newId = String(Date.now());
    setContactData({
      ...contactData,
      addresses: [
        ...contactData.addresses,
        { id: newId, label: "home", street: "", city: "", state: "", postalCode: "" },
      ],
    });
  };

  const removeAddress = (id: string) => {
    setContactData({
      ...contactData,
      addresses: contactData.addresses.filter((a) => a.id !== id),
    });
  };

  const updateAddress = (id: string, field: string, value: string) => {
    setContactData({
      ...contactData,
      addresses: contactData.addresses.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack.Screen
          options={{
            title: "Loading...",
            headerTitleStyle: { color: theme.text },
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.accent,
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading contact...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const getInitials = () => {
    const first = contactData.firstName.charAt(0).toUpperCase();
    const last = contactData.lastName.charAt(0).toUpperCase();
    return first + last || first || last || "?";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: contactId ? "Edit Contact" : "Add Contact",
          headerShown: true,
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.accent,
          headerRight: () => (
            <TouchableOpacity 
              onPress={saveContact} 
              style={{ 
                marginRight: 15,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: theme.accent,
                borderRadius: 8,
              }}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarTouchable}>
              {contactData.imageUri ? (
                <Image
                  source={{ uri: contactData.imageUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
              )}
              <View style={[styles.cameraIconContainer, { backgroundColor: theme.accent }]}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Text style={[styles.photoButtonText, { color: theme.accent }]}>
                  {contactData.imageUri ? "Change Photo" : "Add Photo"}
                </Text>
              </TouchableOpacity>
              {contactData.imageUri && (
                <>
                  <Text style={[styles.photoDivider, { color: theme.secondaryText }]}>•</Text>
                  <TouchableOpacity style={styles.photoButton} onPress={removeImage}>
                    <Text style={[styles.photoButtonText, { color: "#FF3B30" }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Name Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={22} color={theme.secondaryText} />
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
            <View style={[styles.divider, { backgroundColor: theme.itemBorder }]} />
            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={22} color={theme.secondaryText} />
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
            <View style={[styles.divider, { backgroundColor: theme.itemBorder }]} />
            <View style={styles.inputGroup}>
              <Ionicons name="business-outline" size={22} color={theme.secondaryText} />
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
              PHONE
            </Text>
            {contactData.phoneNumbers.map((phoneItem, index) => (
              <View key={phoneItem.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.itemBorder }]} />}
                <View style={styles.inputGroup}>
                  <Ionicons name="call-outline" size={22} color={theme.secondaryText} />
                  <View style={styles.multiInputContainer}>
                    <TextInput
                      style={[styles.labelInput, { color: theme.secondaryText }]}
                      placeholder="Label"
                      placeholderTextColor={theme.secondaryText}
                      value={phoneItem.label}
                      onChangeText={(text) =>
                        updatePhoneNumber(phoneItem.id, "label", text)
                      }
                    />
                    <TextInput
                      style={[styles.valueInput, { color: theme.text }]}
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
                      <Ionicons name="remove-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addPhoneNumber}>
              <Ionicons name="add-circle" size={24} color={theme.accent} />
              <Text style={[styles.addButtonText, { color: theme.accent }]}>
                Add Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
              EMAIL
            </Text>
            {contactData.emails.map((emailItem, index) => (
              <View key={emailItem.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.itemBorder }]} />}
                <View style={styles.inputGroup}>
                  <Ionicons name="mail-outline" size={22} color={theme.secondaryText} />
                  <View style={styles.multiInputContainer}>
                    <TextInput
                      style={[styles.labelInput, { color: theme.secondaryText }]}
                      placeholder="Label"
                      placeholderTextColor={theme.secondaryText}
                      value={emailItem.label}
                      onChangeText={(text) =>
                        updateEmail(emailItem.id, "label", text)
                      }
                    />
                    <TextInput
                      style={[styles.valueInput, { color: theme.text }]}
                      placeholder="Email"
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
                      <Ionicons name="remove-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addEmail}>
              <Ionicons name="add-circle" size={24} color={theme.accent} />
              <Text style={[styles.addButtonText, { color: theme.accent }]}>
                Add Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Address Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
              ADDRESS
            </Text>
            {contactData.addresses.map((addressItem, index) => (
              <View key={addressItem.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.itemBorder }]} />}
                <View style={styles.inputGroup}>
                  <Ionicons name="location-outline" size={22} color={theme.secondaryText} />
                  <View style={styles.multiInputContainer}>
                    <TextInput
                      style={[styles.labelInput, { color: theme.secondaryText }]}
                      placeholder="Label"
                      placeholderTextColor={theme.secondaryText}
                      value={addressItem.label}
                      onChangeText={(text) =>
                        updateAddress(addressItem.id, "label", text)
                      }
                    />
                    <TextInput
                      style={[styles.valueInput, { color: theme.text }]}
                      placeholder="Street"
                      placeholderTextColor={theme.secondaryText}
                      value={addressItem.street}
                      onChangeText={(text) =>
                        updateAddress(addressItem.id, "street", text)
                      }
                    />
                    <View style={styles.addressRow}>
                      <TextInput
                        style={[styles.addressSmallInput, { color: theme.text }]}
                        placeholder="City"
                        placeholderTextColor={theme.secondaryText}
                        value={addressItem.city}
                        onChangeText={(text) =>
                          updateAddress(addressItem.id, "city", text)
                        }
                      />
                      <TextInput
                        style={[styles.addressTinyInput, { color: theme.text }]}
                        placeholder="State"
                        placeholderTextColor={theme.secondaryText}
                        value={addressItem.state}
                        onChangeText={(text) =>
                          updateAddress(addressItem.id, "state", text)
                        }
                      />
                      <TextInput
                        style={[styles.addressTinyInput, { color: theme.text }]}
                        placeholder="ZIP"
                        placeholderTextColor={theme.secondaryText}
                        keyboardType="number-pad"
                        value={addressItem.postalCode}
                        onChangeText={(text) =>
                          updateAddress(addressItem.id, "postalCode", text)
                        }
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAddress(addressItem.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="remove-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addAddress}>
              <Ionicons name="add-circle" size={24} color={theme.accent} />
              <Text style={[styles.addButtonText, { color: theme.accent }]}>
                Add Address
              </Text>
            </TouchableOpacity>
          </View>

          {/* Birthday & Notes Section */}
          <View style={[styles.section, { backgroundColor: theme.inputBg }]}>
            <View style={styles.inputGroup}>
              <Ionicons name="calendar-outline" size={22} color={theme.secondaryText} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Birthday (MM/DD/YYYY)"
                placeholderTextColor={theme.secondaryText}
                value={contactData.birthday}
                onChangeText={(text) =>
                  setContactData({ ...contactData, birthday: text })
                }
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.itemBorder }]} />
            <View style={styles.inputGroup}>
              <Ionicons
                name="document-text-outline"
                size={22}
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

          {/* Delete Button */}
          {contactId && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={deleteContact}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.deleteButtonText}>Delete Contact</Text>
            </TouchableOpacity>
          )}

          {/* Save Button - Fixed at bottom */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accent }]}
            onPress={saveContact}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.saveButtonText}>Save Contact</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarTouchable: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  photoButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  photoButton: {
    paddingVertical: 4,
  },
  photoButtonText: {
    fontSize: 17,
    fontWeight: "500",
  },
  photoDivider: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    marginLeft: 12,
    paddingVertical: 4,
  },
  labelInput: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  valueInput: {
    fontSize: 17,
  },
  multiInputContainer: {
    flex: 1,
    marginLeft: 12,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 17,
    marginLeft: 8,
    fontWeight: "500",
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  addressSmallInput: {
    flex: 2,
    fontSize: 17,
  },
  addressTinyInput: {
    flex: 1,
    fontSize: 17,
  },
  deleteButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 17,
    fontWeight: "600",
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});