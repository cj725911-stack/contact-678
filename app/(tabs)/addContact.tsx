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
} from "react-native";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../ThemeContext";

export default function AddContactScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [hasContactsPermission, setHasContactsPermission] = useState<boolean | null>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  const { theme } = useTheme();

  // 📸 Pick an image from the library
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasMediaPermission(status === "granted");

    if (status !== "granted") {
      Alert.alert("Permission denied", "We need access to your gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Resize image to a smaller size before setting it
      const resizedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPhoto(resizedImage.uri);
    }
  };

  // 📱 Request contacts permission
  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setHasContactsPermission(status === "granted");
  };

  // 💾 Save the contact
  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert("Missing Info", "Please enter at least a name and phone number.");
      return;
    }

    if (!hasContactsPermission) {
      Alert.alert("Permission denied", "We need access to your contacts.");
      return;
    }

    try {
      console.log("Saving contact...");

      const newContact: any = {
        [Contacts.Fields.FirstName]: name,
        [Contacts.Fields.PhoneNumbers]: [{ label: "mobile", number: phone }],
      };

      if (email) {
        newContact[Contacts.Fields.Emails] = [{ label: "work", email }];
      }

      if (photo) {
        newContact[Contacts.Fields.Image] = { uri: photo };
      }

      // Add the contact to the device's contacts
      await Contacts.addContactAsync(newContact);

      Alert.alert("Success", "Contact saved successfully!");
      router.back();
    } catch (error) {
      console.error("Error saving contact:", error);
      Alert.alert("Error", "Failed to save contact.");
    }
  };

  // 📲 Check if we have permission on mount
  useEffect(() => {
    requestContactsPermission();
  }, []);

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={26} color={theme.accent} />
            </TouchableOpacity>
            <Text style={styles.title}>New Contact</Text>
            <View style={{ width: 26 }} />
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={60} color="#aaa" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.addPhotoText}>
                {photo ? "Change photo" : "Add photo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Fields */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#777" />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={theme.secondaryText}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#777" />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={theme.secondaryText}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#777" />
              <TextInput
                style={styles.input}
                placeholder="Email (optional)"
                placeholderTextColor={theme.secondaryText}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 30,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.text,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: 30,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    addPhotoText: {
      color: theme.accent,
      marginTop: 8,
      fontSize: 16,
    },
    form: {
      width: "100%",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 15,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
      color: theme.text,
    },
    saveButton: {
      backgroundColor: theme.accent,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    saveText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
  });