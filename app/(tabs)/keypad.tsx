import { View, Text, TouchableOpacity, StyleSheet, Vibration, PermissionsAndroid, Platform, Modal } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../_ThemeContext";
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';

const dialPad = [
  [
    { number: "1", letters: "" },
    { number: "2", letters: "ABC" },
    { number: "3", letters: "DEF" },
  ],
  [
    { number: "4", letters: "GHI" },
    { number: "5", letters: "JKL" },
    { number: "6", letters: "MNO" },
  ],
  [
    { number: "7", letters: "PQRS" },
    { number: "8", letters: "TUV" },
    { number: "9", letters: "WXYZ" },
  ],
  [
    { number: "*", letters: "" },
    { number: "0", letters: "+" },
    { number: "#", letters: "" },
  ],
];

export default function Keypad() {
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    requestPhonePermission();
  }, []);

  const requestPhonePermission = async () => {
    if (Platform.OS === 'android') {
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
          console.log('Phone call permission granted');
        } else {
          console.log('Phone call permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handlePress = (value: string) => {
    Vibration.vibrate(50);
    setPhoneNumber((prev) => prev + value);
  };

  const handleLongPress = (value: string) => {
    if (value === "0") {
      Vibration.vibrate(50);
      setPhoneNumber((prev) => prev + "+");
    }
  };

  const handleDelete = () => {
    if (phoneNumber) {
      Vibration.vibrate(50);
      setPhoneNumber((prev) => prev.slice(0, -1));
    }
  };

  const handleLongDelete = () => {
    if (phoneNumber) {
      Vibration.vibrate(100);
      setPhoneNumber("");
    }
  };

  const handleCall = () => {
    if (!phoneNumber) {
      setErrorMessage("Please enter a phone number");
      setShowErrorAlert(true);
      return;
    }

    try {
      const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
      
      if (Platform.OS === 'android') {
        RNImmediatePhoneCall.immediatePhoneCall(cleanNumber);
        console.log(`Calling ${cleanNumber}...`);
        // Clear the number after initiating call
        setPhoneNumber("");
      } else {
        // For iOS, show a message that immediate calling isn't supported
        setErrorMessage("Immediate calling is only available on Android");
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('Call error:', error);
      setErrorMessage("Unable to make call. Please check permissions.");
      setShowErrorAlert(true);
    }
  };

  // Error Alert Component
  const ErrorAlert = () => (
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
          <View style={[styles.alertIcon, { backgroundColor: "#FF3B30" }]}>
            <Ionicons name="alert-circle" size={24} color="#fff" />
          </View>
          <Text style={[styles.alertTitle, { color: theme.text }]}>Error</Text>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.displayContainer}>
        <Text style={[styles.phoneNumber, { color: theme.text }]}>
          {phoneNumber || ""}
        </Text>
      </View>

      <View style={styles.dialPadContainer}>
        {dialPad.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((item) => (
              <TouchableOpacity
                key={item.number}
                style={styles.button}
                onPress={() => handlePress(item.number)}
                onLongPress={() => handleLongPress(item.number)}
                delayLongPress={500}
              >
                <Text style={[styles.number, { color: theme.text }]}>
                  {item.number}
                </Text>
                {item.letters && (
                  <Text style={[styles.letters, { color: theme.secondaryText }]}>
                    {item.letters}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.actionContainer}>
        <View style={styles.actionButton} />
        
        <TouchableOpacity
          style={[
            styles.callButton, 
            { 
              backgroundColor: phoneNumber ? theme.accent : theme.secondaryText,
              opacity: phoneNumber ? 1 : 0.5 
            }
          ]}
          onPress={handleCall}
          disabled={!phoneNumber}
        >
          <Ionicons name="call" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          onLongPress={handleLongDelete}
          delayLongPress={500}
          disabled={!phoneNumber}
        >
          <Ionicons
            name="backspace-outline"
            size={28}
            color={phoneNumber ? theme.text : theme.secondaryText}
          />
        </TouchableOpacity>
      </View>

      <ErrorAlert />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  displayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  phoneNumber: {
    fontSize: 32,
    letterSpacing: 2,
  },
  dialPadContainer: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  button: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  number: {
    fontSize: 32,
    fontWeight: "300",
  },
  letters: {
    fontSize: 12,
    marginTop: -5,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  callButton: {
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    width: 65,
    height: 65,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  alertBox: {
    width: 280,
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
});