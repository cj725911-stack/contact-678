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
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../_ThemeContext';

const { width } = Dimensions.get('window');

const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const { theme, isDark } = useTheme();

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

  const loadContacts = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Image,
            Contacts.Fields.ImageAvailable,
          ],
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
      } else {
        setErrorMessage('Permission denied. Please grant contacts access in settings.');
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setErrorMessage('Failed to load contacts. Please try again.');
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadContacts(true);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) =>
        contact.name?.toLowerCase().includes(text.toLowerCase()) ||
        contact.phoneNumbers?.some(phone => 
          phone.number?.includes(text)
        )
      );
      setFilteredContacts(filtered);
    }
  };

  const confirmDeleteContact = (contact: any) => {
    setContactToDelete(contact);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    
    setDeleting(true);
    setDeleteModalVisible(false);

    try {
      // Delete from device contacts permanently
      await Contacts.removeContactAsync(contactToDelete.id);
      
      // Update local state immediately for responsive UI
      const newContacts = contacts.filter((c) => c.id !== contactToDelete.id);
      const newFiltered = filteredContacts.filter((c) => c.id !== contactToDelete.id);
      
      setContacts(newContacts);
      setFilteredContacts(newFiltered);
      
      // Show success message
      setSuccessMessage(`${contactToDelete.name || 'Contact'} deleted successfully`);
      setShowSuccessAlert(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting contact:', error);
      setErrorMessage('Failed to delete contact. Please try again.');
      setShowErrorAlert(true);
    } finally {
      setDeleting(false);
      setContactToDelete(null);
    }
  };

  const renderAvatar = (contact: any) => {
    const hasImage = contact.imageAvailable && contact.image?.uri;
    
    if (hasImage) {
      return (
        <Image
          source={{ uri: contact.image.uri }}
          style={styles.avatarImage}
        />
      );
    } else {
      return (
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={styles.avatarText}>
            {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      );
    }
  };

  const renderItem = ({ item }: any) => {
    const phone = item.phoneNumbers?.[0]?.number;
    return (
      <TouchableOpacity
        style={[styles.item, { borderBottomColor: theme.itemBorder }]}
        onPress={() =>
          router.push({
            pathname: './call',
            params: {
              name: item.name,
              phone: phone || '',
              contactId: item.id,
              imageUri: item.imageAvailable && item.image?.uri ? item.image.uri : '',
            },
          })
        }
        onLongPress={() => confirmDeleteContact(item)}
        activeOpacity={0.7}
      >
        {renderAvatar(item)}
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {item.name || 'Unnamed Contact'}
          </Text>
          <Text
            style={[
              styles.phone,
              { color: phone ? theme.secondaryText : '#888' },
            ]}
            numberOfLines={1}
          >
            {phone || 'No number'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
      </TouchableOpacity>
    );
  };

  // Success Alert Component
  const SuccessAlert = () => (
    <Modal
      transparent
      visible={showSuccessAlert}
      animationType="fade"
      onRequestClose={() => setShowSuccessAlert(false)}
    >
      <View style={styles.alertOverlay}>
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.alertIcon, { backgroundColor: '#34C759' }]}>
            <Ionicons name="checkmark" size={28} color="#fff" />
          </View>
          <Text style={[styles.alertTitle, { color: theme.text }]}>Success</Text>
          <Text style={[styles.alertMessage, { color: theme.secondaryText }]}>
            {successMessage}
          </Text>
        </View>
      </View>
    </Modal>
  );

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
        style={styles.alertOverlay}
      >
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.alertIcon, { backgroundColor: '#FF3B30' }]}>
            <Ionicons name="alert-circle" size={28} color="#fff" />
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

  // Deleting Overlay
  const DeletingOverlay = () => (
    <Modal transparent visible={deleting} animationType="fade">
      <View style={styles.alertOverlay}>
        <View style={[styles.alertBox, { backgroundColor: theme.inputBg }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.alertMessage, { color: theme.text, marginTop: 16 }]}>
            Deleting contact...
          </Text>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
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

        <View style={styles.headerActions}>
          {/* Add Contact */}
          <TouchableOpacity 
            onPress={() => router.push('./addContact')}
            activeOpacity={0.7}
            style={styles.headerButton}
          >
            <Ionicons name="add-circle" size={30} color={theme.accent} />
          </TouchableOpacity>

          {/* Three Dots Menu */}
          <TouchableOpacity 
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
            style={styles.headerButton}
          >
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
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search contacts..."
          placeholderTextColor={theme.secondaryText}
          value={search}
          onChangeText={handleSearch}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Contact List */}
      {filteredContacts.length > 0 ? (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color={theme.secondaryText} />
          <Text style={[styles.empty, { color: theme.secondaryText }]}>
            {search ? 'No contacts found' : 'No contacts yet'}
          </Text>
          {!search && (
            <TouchableOpacity 
              onPress={() => router.push('./addContact')}
              style={[styles.addButton, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.addButtonText}>Add Your First Contact</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Themed Tab Bar */}
      <View style={[
        styles.tabBar, 
        { 
          backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7',
          borderTopColor: theme.itemBorder 
        }
      ]} />

      {/* Delete Confirmation Modal */}
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDeleteModalVisible(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.deleteModalBox, { backgroundColor: theme.inputBg }]}>
            <View style={[styles.alertIcon, { backgroundColor: '#FF3B30' }]}>
              <Ionicons name="trash" size={28} color="#fff" />
            </View>
            <Text style={[styles.alertTitle, { color: theme.text }]}>
              Delete Contact
            </Text>
            <Text style={[styles.alertMessage, { color: theme.secondaryText }]}>
              Are you sure you want to permanently delete{'\n'}
              <Text style={{ fontWeight: '600' }}>{contactToDelete?.name || 'this contact'}</Text>
              {'\n'}from your phone?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.itemBorder }]}
                onPress={() => setDeleteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FF3B30' }]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
              { backgroundColor: theme.inputBg, borderColor: theme.itemBorder },
            ]}
          >
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.itemBorder }]}
              onPress={() => {
                setMenuVisible(false);
                onRefresh();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={20} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.itemBorder }]}
              onPress={() => {
                setMenuVisible(false);
                router.push('./settings');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={20} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setSuccessMessage('Contacts App v1.0\nBuilt with Expo & React Native');
                setShowSuccessAlert(true);
                setTimeout(() => setShowSuccessAlert(false), 3000);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>About</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Alerts */}
      <SuccessAlert />
      <ErrorAlert />
      <DeletingOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomWidth: 1,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginTop: 30 
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16,
    height: 44,
  },
  clearButton: {
    padding: 4,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: { 
    fontSize: 16,
    marginTop: 12,
  },
  empty: { 
    fontSize: 18,
    marginTop: 16,
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 20,
  },
  info: { 
    marginLeft: 12, 
    flex: 1,
  },
  name: { 
    fontSize: 17, 
    fontWeight: '500',
  },
  phone: { 
    fontSize: 15, 
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalBox: {
    padding: 24,
    borderRadius: 20,
    width: width > 600 ? 340 : Math.min(width - 40, 320),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 15,
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 10,
  },
  menuContainer: {
    width: 200,
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: width > 600 ? 320 : Math.min(width - 60, 280),
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  alertButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactsScreen;