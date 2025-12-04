import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../ThemeContext';

const SettingsScreen = () => {
  const { theme, themeMode, setThemeMode } = useTheme();

  const SettingItem = ({ icon, label, rightElement, onPress }: any) => (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: theme.itemBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={22} color={theme.text} style={{ width: 28 }} />
        <Text style={[styles.itemText, { color: theme.text }]}>{label}</Text>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={18} color={theme.secondaryText} />
      )}
    </TouchableOpacity>
  );

  const ThemeModeItem = ({ mode, label, icon }: any) => {
    const isSelected = themeMode === mode;
    return (
      <TouchableOpacity
        style={[
          styles.themeOption,
          {
            backgroundColor: isSelected ? theme.accent : theme.inputBg,
            borderColor: isSelected ? theme.accent : theme.itemBorder,
          },
        ]}
        onPress={() => setThemeMode(mode)}
      >
        <Ionicons
          name={icon}
          size={24}
          color={isSelected ? '#fff' : theme.text}
        />
        <Text
          style={[
            styles.themeLabel,
            { color: isSelected ? '#fff' : theme.text },
          ]}
        >
          {label}
        </Text>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#fff"
            style={{ position: 'absolute', top: 8, right: 8 }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.itemBorder, backgroundColor: theme.background },
        ]}
      >
        {/* Back Arrow */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      {/* Theme Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
          Appearance
        </Text>
        <View style={styles.themeGrid}>
          <ThemeModeItem mode="system" label="System" icon="phone-portrait-outline" />
          <ThemeModeItem mode="light" label="Light" icon="sunny-outline" />
          <ThemeModeItem mode="dark" label="Dark" icon="moon-outline" />
        </View>
      </View>

      {/* Settings Options */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
          General
        </Text>
        <SettingItem
          icon="person-circle"
          label="Profile"
          onPress={() => router.push('./profile')}
        />
        <SettingItem
          icon="information-circle"
          label="About"
          onPress={() =>
            Alert.alert('About', 'Contacts App v1.0\nBuilt with Expo & React Native')
          }
        />
      </View>

      {/* Black Tab Bar */}
      <View style={styles.tabBar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 5,
    zIndex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  themeGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  themeOption: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  themeLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    marginLeft: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: '#222',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default SettingsScreen;