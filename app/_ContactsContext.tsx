import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Contacts from 'expo-contacts';

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: Array<{ number: string }>;
  imageAvailable?: boolean;
  image?: { uri: string };
}

interface ContactsContextType {
  contacts: Contact[];
  loading: boolean;
  refreshContacts: () => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export const ContactsProvider = ({ children }: { children: React.ReactNode }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
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
        } else {
          setContacts([]);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshContacts = async () => {
    await loadContacts();
  };

  const deleteContact = async (contactId: string) => {
    try {
      await Contacts.removeContactAsync(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  };

  return (
    <ContactsContext.Provider value={{ contacts, loading, refreshContacts, deleteContact }}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};