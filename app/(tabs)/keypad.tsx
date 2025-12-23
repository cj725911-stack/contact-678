import { View, Text, TouchableOpacity, StyleSheet, Vibration } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../_ThemeContext";
import { Linking } from "react-native";

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

  const handlePress = (value: string) => {
    Vibration.vibrate(50);
    setPhoneNumber((prev) => prev + value);
  };

  const handleDelete = () => {
    Vibration.vibrate(50);
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

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
          style={[styles.callButton, { backgroundColor: theme.accent }]}
          onPress={handleCall}
          disabled={!phoneNumber}
        >
          <Ionicons name="call" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          disabled={!phoneNumber}
        >
          <Ionicons
            name="backspace-outline"
            size={28}
            color={phoneNumber ? theme.text : theme.secondaryText}
          />
        </TouchableOpacity>
      </View>
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
});