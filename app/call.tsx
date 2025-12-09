import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  Share,
  Clipboard,
  Dimensions,
  PermissionsAndroid,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../_ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';

const { width } = Dimensions.get("window");

export default function CallScreen() {
  const router = useRouter();
  const { contact, name, phone, imageUri } = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const requestPhonePermission = async () => {
      console.log('requestfunction');
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'Phone Call Permission',
            message: 'This app needs access to make phone calls.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can make calls');
        } else {
          console.log('Call permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    };
    requestPhonePermission();
  }, []);

  // Make immediate phone call (no dialer screen)
  const makeImmediateCall = () => {
    if (!phone) {
      Alert.alert("Error", "No phone number found.");
      return;
    }

    try {
      const cleanNumber = (phone as string).replace(/[^0-9+]/g, "");
      RNImmediatePhoneCall.immediatePhoneCall(cleanNumber);
      console.log(`Calling ${cleanNumber}...`);
    } catch (error) {
      console.error('Call error:', error);
      Alert.alert("Error", "Failed to make call. Make sure CALL_PHONE permission is granted.");
    }
  };

  // Send SMS
  const sendSMS = () => {
    if (!phone) return Alert.alert("No number", "This contact has no phone number.");
    Linking.openURL(`sms:${phone}`);
  };

  // Video call placeholder
  const startVideo = () => {
    Alert.alert(
      "Video Call", 
      "Would you like to use:",
      [
        { text: "WhatsApp", onPress: () => openWhatsAppCall() },
        { text: "Google Duo", onPress: () => openGoogleDuo() },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // WhatsApp regular chat
  const openWhatsApp = () => {
    if (!phone) return Alert.alert("No number", "This contact has no phone number.");
    const cleanNumber = (phone as string).replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${cleanNumber}`);
  };

  // WhatsApp Voice Call
  const openWhatsAppCall = () => {
    if (!phone) return Alert.alert("No number", "This contact has no phone number.");
    const cleanNumber = (phone as string).replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${cleanNumber}?call=voice`);
  };

  // Google Duo
  const openGoogleDuo = () => {
    if (!phone) return;
    const cleanNumber = (phone as string).replace(/[^0-9]/g, "");
    Linking.openURL(`duo:${cleanNumber}`);
  };

  // Email
  const sendEmail = () => {
    Alert.alert("Email", "No email address saved for this contact.");
  };

  // Copy number
  const copyNumber = () => {
    if (!phone) return;
    Clipboard.setString(phone as string);
    Alert.alert("Copied", "Phone number copied to clipboard");
  };

  // Share contact
  const shareContact = async () => {
    try {
      await Share.share({
        message: `${name}\n${phone}`,
        title: "Share Contact",
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? "Removed from Favorites" : "Added to Favorites",
      `${name} ${isFavorite ? "removed from" : "added to"} favorites`
    );
  };

  // Edit contact
  const editContact = () => {
    router.push({
      pathname: '/editcontact',
      params: { name, phone, imageUri: imageUri || '' }
    });
  };

  // Delete contact
  const deleteContact = () => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Deleted", "Contact deleted successfully");
            router.back();
          },
        },
      ]
    );
  };

  // Navigate to features
  const navigateToHistory = () => {
    router.push({
      pathname: '/callhistory',
      params: { name, phone }
    });
  };

  const navigateToReminder = () => {
    router.push({
      pathname: '/setreminder',
      params: { name, phone }
    });
  };

  const navigateToNotes = () => {
    router.push({
      pathname: '/notes',
      params: { name, phone }
    });
  };

  // Render avatar with image or initial
  const renderAvatar = () => {
    const hasImage = imageUri && imageUri !== '';
    
    if (hasImage) {
      return (
        <Image
          source={{ uri: imageUri as string }}
          style={styles.avatarImage}
        />
      );
    } else {
      return (
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={styles.avatarText}>
            {name ? (name as string).charAt(0).toUpperCase() : "?"}
          </Text>
        </View>
      );
    }
  };

  const styles = createStyles(theme, isDark);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: name as string || "Contact",
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.accent,
        }}
      />

      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Card */}
        <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
          <View style={styles.cardTop}>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]}>
                  {name || "Unknown"}
                </Text>
                <TouchableOpacity onPress={toggleFavorite}>
                  <Ionicons
                    name={isFavorite ? "star" : "star-outline"}
                    size={24}
                    color={isFavorite ? "#FFD700" : theme.secondaryText}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.phoneSection}>
                <View>
                  <Text style={[styles.numberLabel, { color: theme.secondaryText }]}>
                    Mobile
                  </Text>
                  <Text style={[styles.phone, { color: theme.text }]}>
                    {phone || "No phone number"}
                  </Text>
                </View>
                <TouchableOpacity onPress={copyNumber} style={styles.copyBtn}>
                  <Ionicons name="copy-outline" size={20} color={theme.accent} />
                </TouchableOpacity>
              </View>
            </View>

            {renderAvatar()}
          </View>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.primaryActions}>
          <ActionButton
            icon="call"
            label="Call"
            color="#34C759"
            onPress={makeImmediateCall}
          />
          <ActionButton
            icon="chatbubble"
            label="Message"
            color="#007AFF"
            onPress={sendSMS}
          />
          <ActionButton
            icon="videocam"
            label="Video"
            color="#5856D6"
            onPress={startVideo}
            iconComponent={MaterialIcons}
            iconName="video-call"
          />
        </View>

        {/* Secondary Action Buttons */}
        <View style={styles.secondaryActions}>
          <SecondaryActionButton
            icon="logo-whatsapp"
            label="WhatsApp"
            onPress={openWhatsApp}
            theme={theme}
          />
          <SecondaryActionButton
            icon="mail-outline"
            label="Email"
            onPress={sendEmail}
            theme={theme}
          />
          <SecondaryActionButton
            icon="share-social-outline"
            label="Share"
            onPress={shareContact}
            theme={theme}
          />
        </View>

        {/* Quick Call Actions */}
        <View style={[styles.quickCallSection, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
            Quick Call Options
          </Text>
          <TouchableOpacity 
            style={styles.quickCallItem}
            onPress={makeImmediateCall}
          >
            <View style={[styles.quickCallIcon, { backgroundColor: '#34C759' }]}>
              <Ionicons name="call" size={20} color="#fff" />
            </View>
            <View style={styles.quickCallText}>
              <Text style={[styles.quickCallTitle, { color: theme.text }]}>
                Instant Call
              </Text>
              <Text style={[styles.quickCallSubtitle, { color: theme.secondaryText }]}>
                Direct call without confirmation
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickCallItem}
            onPress={openWhatsAppCall}
          >
            <View style={[styles.quickCallIcon, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            </View>
            <View style={styles.quickCallText}>
              <Text style={[styles.quickCallTitle, { color: theme.text }]}>
                WhatsApp Call
              </Text>
              <Text style={[styles.quickCallSubtitle, { color: theme.secondaryText }]}>
                Free voice call via WhatsApp
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Options Section */}
        <View style={[styles.optionsSection, { backgroundColor: theme.inputBg }]}>
          <OptionItem
            icon="time-outline"
            label="Call History"
            onPress={navigateToHistory}
            theme={theme}
          />
          <OptionItem
            icon="notifications-outline"
            label="Set Reminder"
            onPress={navigateToReminder}
            theme={theme}
          />
          <OptionItem
            icon="document-text-outline"
            label="Add Notes"
            onPress={navigateToNotes}
            theme={theme}
          />
          <OptionItem
            icon="create-outline"
            label="Edit Contact"
            onPress={editContact}
            theme={theme}
          />
          <OptionItem
            icon="trash-outline"
            label="Delete Contact"
            onPress={deleteContact}
            theme={theme}
            danger
          />
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Black Tab Bar */}
      <View style={styles.tabBar} />
    </SafeAreaView>
  );
}

// Action Button Component
const ActionButton = ({ icon, label, color, onPress, iconComponent, iconName }: any) => {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);
  const Icon = iconComponent || Ionicons;
  return (
    <TouchableOpacity style={styles.actionBtnContainer} onPress={onPress}>
      <View style={[styles.actionBtn, { backgroundColor: color }]}>
        <Icon name={iconName || icon} size={28} color="#fff" />
      </View>
      <Text style={[styles.actionLabel, { color: theme.secondaryText }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Secondary Action Button Component
const SecondaryActionButton = ({ icon, label, onPress, theme }: any) => {
  const { theme: contextTheme, isDark } = useTheme();
  const styles = createStyles(contextTheme, isDark);
  return (
    <TouchableOpacity
      style={[styles.secondaryActionBtn, { backgroundColor: contextTheme.inputBg }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={contextTheme.text} />
      <Text style={[styles.secondaryActionLabel, { color: contextTheme.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Option Item Component
const OptionItem = ({ icon, label, onPress, theme, danger }: any) => {
  const { theme: contextTheme, isDark } = useTheme();
  const styles = createStyles(contextTheme, isDark);
  return (
    <TouchableOpacity
      style={[styles.optionItem, { borderBottomColor: contextTheme.itemBorder }]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? "#FF3B30" : contextTheme.text}
        style={{ width: 28 }}
      />
      <Text style={[styles.optionLabel, { color: danger ? "#FF3B30" : contextTheme.text }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={contextTheme.secondaryText} />
    </TouchableOpacity>
  );
};

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 20,
    },
    card: {
      marginHorizontal: width > 600 ? 40 : 20,
      marginTop: 0,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    info: {
      flex: 1,
      marginRight: 15,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    name: {
      fontSize: 24,
      fontWeight: "bold",
    },
    phoneSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    numberLabel: {
      fontSize: 13,
      marginBottom: 4,
    },
    phone: {
      fontSize: 17,
      fontWeight: "500",
    },
    copyBtn: {
      padding: 8,
    },
    avatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
    },
    avatarText: {
      color: "#fff",
      fontSize: 30,
      fontWeight: "bold",
    },
    primaryActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: width > 600 ? 60 : 30,
      marginTop: 30,
      marginBottom: 20,
    },
    actionBtnContainer: {
      alignItems: "center",
    },
    actionBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    actionLabel: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: "500",
    },
    secondaryActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: width > 600 ? 60 : 20,
      marginBottom: 20,
    },
    secondaryActionBtn: {
      flex: 1,
      marginHorizontal: 6,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryActionLabel: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "500",
    },
    quickCallSection: {
      marginHorizontal: width > 600 ? 40 : 20,
      marginTop: 10,
      marginBottom: 20,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    quickCallItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    quickCallIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    quickCallText: {
      flex: 1,
    },
    quickCallTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
    },
    quickCallSubtitle: {
      fontSize: 13,
    },
    optionsSection: {
      marginHorizontal: width > 600 ? 40 : 20,
      marginTop: 10,
      borderRadius: 12,
      overflow: "hidden",
    },
    optionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
    },
    optionLabel: {
      flex: 1,
      fontSize: 16,
      marginLeft: 12,
    },
    tabBar: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: "#000",
      paddingVertical: 30,
      borderTopWidth: 1,
      borderTopColor: "#222",
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
  });