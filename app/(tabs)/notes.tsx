import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Note {
  id: string;
  text: string;
  timestamp: number;
}

export default function NotesScreen() {
  const { name, phone } = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  const storageKey = `notes:${phone}`;

  // Load notes from storage
  const loadNotes = async () => {
    try {
      setLoading(true);
      const result = await window.storage.get(storageKey);
      if (result && result.value) {
        const loadedNotes = JSON.parse(result.value);
        setNotes(loadedNotes.sort((a: Note, b: Note) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [phone])
  );

  // Save notes to storage
  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      await window.storage.set(storageKey, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  // Add new note
  const addNote = async () => {
    if (!newNote.trim()) {
      Alert.alert('Empty Note', 'Please enter some text');
      return;
    }

    const note: Note = {
      id: Date.now().toString(),
      text: newNote.trim(),
      timestamp: Date.now(),
    };

    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    setNewNote('');
    await saveNotes(updatedNotes);
  };

  // Delete note
  const deleteNote = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedNotes = notes.filter((note) => note.id !== id);
          setNotes(updatedNotes);
          await saveNotes(updatedNotes);
        },
      },
    ]);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderNote = ({ item }: { item: Note }) => (
    <View style={[styles.noteItem, { backgroundColor: theme.inputBg }]}>
      <View style={styles.noteContent}>
        <Text style={[styles.noteText, { color: theme.text }]}>{item.text}</Text>
        <Text style={[styles.noteTime, { color: theme.secondaryText }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteNote(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const styles = createStyles(theme, isDark);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: `Notes - ${name}`,
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.accent,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Input Section */}
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Add a note..."
              placeholderTextColor={theme.secondaryText}
              value={newNote}
              onChangeText={setNewNote}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.accent }]}
              onPress={addNote}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Notes List */}
          {notes.length > 0 ? (
            <FlatList
              data={notes}
              keyExtractor={(item) => item.id}
              renderItem={renderNote}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={80} color={theme.secondaryText} />
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                No notes yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
                Add notes about your conversations
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.itemBorder || '#333',
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      fontSize: 16,
      maxHeight: 100,
      marginRight: 12,
      paddingVertical: 8,
    },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      padding: 16,
    },
    noteItem: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    noteContent: {
      flex: 1,
    },
    noteText: {
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 8,
    },
    noteTime: {
      fontSize: 13,
    },
    deleteBtn: {
      padding: 4,
      marginLeft: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
  });