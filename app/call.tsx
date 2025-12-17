import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Share,
  Clipboard,
  Dimensions,
  PermissionsAndroid,
  Image,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../_ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';
import * as Contacts from 'expo-contacts';

const { width } = Dimensions.get("window");

export default function CallScreen() {
  const router = useRouter();
  const { contact, name, phone, imageUri, contactId } = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [showVideoAlert, setShowVideoAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCallAlert, setShowCallAlert] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);
  const [favoriteAction, setFavoriteAction] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

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
      setErrorMessage("No phone number found.");
      setShowErrorAlert(true);
      return;
    }

    try {
      const cleanNumber = (phone as string).replace(/[^0-9+]/g, "");
      RNImmediatePhoneCall.immediatePhoneCall(cleanNumber);
      console.log(`Calling ${cleanNumber}...`);
    } catch (error) {
      console.error('Call error:', error);
      setShowCallAlert(true);
    }
  };

  // Send SMS
  const sendSMS = () => {
    if (!phone) {
      setErrorMessage("This contact has no phone number.");
      setShowErrorAlert(true);
      return;
    }
    Linking.openURL(`sms:${phone}`);
  };

  // Video call with themed alert
  const startVideo = () => {
    setShowVideoAlert(true);
  };

  // WhatsApp regular chat
  const openWhatsApp = () => {
    if (!phone) {
      setErrorMessage("This contact has no phone number.");
      setShowErrorAlert(true);
      return;
    }
    const cleanNumber = (phone as string).replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${cleanNumber}`);
  };

  // WhatsApp Voice Call
  const openWhatsAppCall = () => {
    if (!phone) {
      setErrorMessage("This contact has no phone number.");
      setShowErrorAlert(true);
      return;
    }
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
    setShowEmailAlert(true);
  };

  // Copy number with themed alert
  const copyNumber = () => {
    if (!phone) return;
    Clipboard.setString(phone as string);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
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
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    setFavoriteAction(newFavoriteState ? "added to" : "removed from");
    setShowFavoriteAlert(true);
  };

  // Edit contact
  const editContact = () => {
    router.push(`/editcontact?id=${contactId}`);
  };

  // Delete contact
  const deleteContact = () => {
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    setShowDeleteAlert(false);
    
    try {
      // Request contacts permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMessage("Permission denied. Cannot delete contact.");
        setShowErrorAlert(true);
        return;
      }

      // If we have a contactId, use it to delete the contact
      if (contactId) {
        await Contacts.removeContactAsync(contactId as string);
        setErrorMessage("Contact deleted successfully");
        setShowErrorAlert(true);
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        // If no contactId, try to find and delete by phone number
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        const cleanSearchPhone = (phone as string).replace(/[^0-9]/g, "");
        const contactToDelete = data.find((c) => 
          c.phoneNumbers?.some((p) => 
            p.number?.replace(/[^0-9]/g, "") === cleanSearchPhone
          )
        );

        if (contactToDelete && contactToDelete.id) {
          await Contacts.removeContactAsync(contactToDelete.id);
          setErrorMessage("Contact deleted successfully");
          setShowErrorAlert(true);
          setTimeout(() => {
            router.back();
          }, 1500);
        } else {
          setErrorMessage("Contact not found in your phone's contacts.");
          setShowErrorAlert(true);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage("Failed to delete contact. Please try again.");
      setShowErrorAlert(true);
    }
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

  // Themed Copy Alert Component
  const ThemedCopyAlert = () => (
    <Modal
      transparent
      visible={showCopyAlert}
      animationType="fade"
      onRequestClose={() => setShowCopyAlert(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowCopyAlert(false)}
        style={styles.modalOverlay}
      >
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.alertIcon, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={24} color="#fff" />
          </View>
          <Text style={[styles.alertTitle, { color: theme.text }]}>Copied</Text>
          <Text style={[styles.alertMessage, { color: theme.secondaryText }]}>
            Phone number copied to clipboard
          </Text>
          <TouchableOpacity
            onPress={() => setShowCopyAlert(false)}
            style={[styles.alertButton, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Themed Error/Info Alert Component
  const ThemedErrorAlert = () => (
    <Modal
      transparent
      visible={showErrorAlert}
      animationType="fade"
      onRequestClose={() => setShowErrorAlert(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowErrorAlert(false)}
        style={styles.modalOverlay}
      >
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.alertIcon, { backgroundColor: errorMessage.includes("successfully") ? theme.accent : "#FF3B30" }]}>
            <Ionicons 
              name={errorMessage.includes("successfully") ? "checkmark" : "alert-circle"} 
              size={24} 
              color="#fff" 
            />
          </View>
          <Text style={[styles.alertTitle, { color: theme.text }]}>
            {errorMessage.includes("successfully") ? "Success" : "Notice"}
          </Text>
          <Text style={[styles.alertMessage, { color: theme.secondaryText }]}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            onPress={() => setShowErrorAlert(false)}
            style={[styles.alertButton, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Themed Call Error Alert
  const ThemedCallAlert = () => (
    <Modal
      transparent
      visible={showCallAlert}
      animationType="fade"
      onRequestClose={() => setShowCallAlert(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowCallAlert(false)}
        style={styles.modalOverlay}
      >
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.alertIcon, { backgroundColor: "#FF3B30" }]}>
            <Ionicons name="call-outline" size={24} color="#fff" />
          </View>
          <Text style={[styles.alertTitle, { color: theme.text }]}>Call Error</Text>
          <Text style={[styles.alertMessage, { color: theme.secondaryText }]}>
            Unable to make call. Please check permissions and try again.
          </Text>
          <TouchableOpacity
            onPress={() => setShowCallAlert(false)}
            style={[styles.alertButton, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Themed Email Alert
  const ThemedEmailAlert = () => (
    <Modal
      transparent
      visible={showEmailAlert}
      animationType="fade"
      onRequestClose={() => setShowEmailAlert(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowEmailAlert(false)}
        style={styles.modalOverlay}
      >
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.alertIcon, { backgroundColor: theme.accent }]}>
            <Ionicons name="mail" size={24} color="#fff" />
          </View>
          <Text style={[styles.alertTitle, { color: theme.text }]}>Email</Text>
          <Text style={[styles.alertMessage, { color: theme.secondaryText }]}>
            Email functionality will be available soon.
          </Text>
          <TouchableOpacity
            onPress={() => setShowEmailAlert(false)}
            style={[styles.alertButton, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Themed Favorite Alert
  const ThemedFavoriteAlert = () => (
    <Modal
      transparent
      visible={showFavoriteAlert}
      animationType="fade"
      onRequestClose={() => setShowFavoriteAlert(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowFavoriteAlert(false)}
        style={styles.modalOverlay}
      >
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.alertIcon, { backgroundColor: "#FFD700" }]}>
            <Ionicons name="star" size={24} color="#fff" />
          </View>
          <Text style={[styles.alertTitle, { color: theme.text }]}>
            {favoriteAction === "added to" ? "Added to Favorites" : "Removed from Favorites"}
          </Text>
          <Text style={[styles.alertMessage, { color: theme.secondaryText }]}>
            {name} {favoriteAction} favorites
          </Text>
          <TouchableOpacity
            onPress={() => setShowFavoriteAlert(false)}
            style={[styles.alertButton, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Themed Delete Confirmation Alert
  const ThemedDeleteAlert = () => (
    <Modal
      transparent
      visible={showDeleteAlert}
      animationType="fade"
      onRequestClose={() => setShowDeleteAlert(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowDeleteAlert(false)}
        style={styles.modalOverlay}
      >
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.alertIcon, { backgroundColor: "#FF3B30" }]}>
            <Ionicons name="trash" size={24} color="#fff" />
          </View>
          <Text style={[styles.alertTitle, { color: theme.text }]}>Delete Contact</Text>
          <Text style={[styles.alertMessage, { color: theme.secondaryText }]}>
            Are you sure you want to permanently delete {name} from your phone's contacts?
          </Text>
          <View style={styles.alertButtonRow}>
            <TouchableOpacity
              onPress={() => setShowDeleteAlert(false)}
              style={[styles.alertButton, styles.alertButtonHalf, { backgroundColor: theme.secondaryText }]}
            >
              <Text style={styles.alertButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDelete}
              style={[styles.alertButton, styles.alertButtonHalf, { backgroundColor: "#FF3B30" }]}
            >
              <Text style={styles.alertButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Themed Video Alert Component
  const ThemedVideoAlert = () => (
    <Modal
      transparent
      visible={showVideoAlert}
      animationType="fade"
      onRequestClose={() => setShowVideoAlert(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowVideoAlert(false)}
        style={styles.modalOverlay}
      >
        <View style={[styles.videoAlertBox, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.videoAlertTitle, { color: theme.text }]}>
            Video Call
          </Text>
          <Text style={[styles.videoAlertSubtitle, { color: theme.secondaryText }]}>
            Would you like to use:
          </Text>

          <TouchableOpacity
            style={[styles.videoOption, { borderBottomColor: theme.itemBorder }]}
            onPress={() => {
              setShowVideoAlert(false);
              openWhatsAppCall();
            }}
          >
            <View style={[styles.videoOptionIcon, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            </View>
            <Text style={[styles.videoOptionText, { color: theme.text }]}>WhatsApp</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.videoOption, { borderBottomColor: theme.itemBorder }]}
            onPress={() => {
              setShowVideoAlert(false);
              openGoogleDuo();
            }}
          >
            <View style={[styles.videoOptionIcon, { backgroundColor: '#4285F4' }]}>
              <MaterialIcons name="duo" size={24} color="#fff" />
            </View>
            <Text style={[styles.videoOptionText, { color: theme.text }]}>Google Duo</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.videoCancelButton}
            onPress={() => setShowVideoAlert(false)}
          >
            <Text style={[styles.videoCancelText, { color: theme.secondaryText }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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

      {/* All Themed Alerts */}
      <ThemedCopyAlert />
      <ThemedErrorAlert />
      <ThemedCallAlert />
      <ThemedEmailAlert />
      <ThemedFavoriteAlert />
      <ThemedDeleteAlert />
      <ThemedVideoAlert />

      {/* Black Tab Bar */}
      <View style={[
        styles.tabBar,
        {
          backgroundColor: theme.inputBg,
          borderTopColor: theme.itemBorder,
        }
      ]} />
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
      paddingVertical: 15,
      borderTopWidth: 1,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    // Themed Alert Modal Styles
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    alertBox: {
      width: width > 600 ? 320 : 280,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    alertIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    alertTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 8,
    },
    alertMessage: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 20,
    },
    alertButton: {
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 8,
      minWidth: 100,
      alignItems: "center",
    },
    alertButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    alertButtonRow: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    alertButtonHalf: {
      flex: 1,
      minWidth: 0,
    },
    // Themed Video Alert Styles
    videoAlertBox: {
      width: width > 600 ? 340 : 300,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    videoAlertTitle: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
    },
    videoAlertSubtitle: {
      fontSize: 15,
      textAlign: "center",
      marginBottom: 20,
    },
    videoOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    videoOptionIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    videoOptionText: {
      flex: 1,
      fontSize: 17,
      fontWeight: "500",
    },
    videoCancelButton: {
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    videoCancelText: {
      fontSize: 17,
      fontWeight: "600",
    },
  });