import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../ThemeContext';

const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { theme } = useTheme();

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Reload contacts whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadContacts();
    }, [])
  );

  const loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        const sorted = data.sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        );
        setContacts(sorted);
        setFilteredContacts(sorted);
      } else {
        setContacts([]);
        setFilteredContacts([]);
      }
    }
    setLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) =>
        contact.name?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  };

  const confirmDeleteContact = (contact: any) => {
    setContactToDelete(contact);
    setDeleteModalVisible(true);
  };

  const handleDelete = (contact: any) => {
    const newContacts = contacts.filter((c) => c.id !== contact.id);
    setContacts(newContacts);
    setFilteredContacts(newContacts);
  };

  const renderItem = ({ item }: any) => {
    const phone = item.phoneNumbers?.[0]?.number;
    return (
      <TouchableOpacity
        style={[styles.item, { borderBottomColor: theme.itemBorder }]}
        onPress={() =>
          router.push({
            pathname: './call',
            params: { name: item.name, phone: phone || '' },
          })
        }
        onLongPress={() => confirmDeleteContact(item)}
      >
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>
            {item.name || 'Unnamed Contact'}
          </Text>
          <Text
            style={[
              styles.phone,
              { color: phone ? theme.secondaryText : '#888' },
            ]}
          >
            {phone || 'No number'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.loading, { color: theme.secondaryText }]}>
          Loading contacts...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.headerBorder,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Contacts</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          {/* Add Contact */}
          <TouchableOpacity onPress={() => router.push('./addContact')}>
            <Ionicons name="add-circle" size={30} color={theme.accent} />
          </TouchableOpacity>

          {/* Three Dots Menu */}
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={26} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.inputBg }]}>
        <Ionicons
          name="search"
          size={20}
          color={theme.secondaryText}
          style={{ marginRight: 6 }}
        />
        <TextInput
          placeholder="Search contacts..."
          placeholderTextColor={theme.secondaryText}
          value={search}
          onChangeText={handleSearch}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      {/* Contact List */}
      {filteredContacts.length > 0 ? (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      ) : (
        <View style={styles.center}>
          <Text style={[styles.empty, { color: theme.secondaryText }]}>
            No contacts found.
          </Text>
        </View>
      )}

      {/* Black Tab Bar */}
      <View style={styles.tabBar} />

      {/* Delete Modal */}
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.background }]}>
            <Text style={{ color: theme.text, fontSize: 18, marginBottom: 20 }}>
              Are you sure you want to delete {contactToDelete?.name}?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.inputBg }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={{ color: theme.text, textAlign: 'center' }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: 'red' }]}
                onPress={() => {
                  handleDelete(contactToDelete);
                  setDeleteModalVisible(false);
                }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3-Dot Popup Menu */}
      <Modal
        transparent
        animationType="fade"
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: theme.background, borderColor: theme.itemBorder },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('./settings');
              }}
            >
              <Ionicons name="settings-outline" size={20} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('About', 'Contacts App v1.0\nBuilt with Expo & React Native');
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>About</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 30 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  searchInput: { flex: 1, height: 40, fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loading: { fontSize: 18 },
  empty: { fontSize: 18 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 18 },
  info: { marginLeft: 12, flex: 1 },
  name: { fontSize: 17, fontWeight: '500' },
  phone: { fontSize: 15, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 10,
  },
  menuContainer: {
    width: 180,
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default ContactsScreen;