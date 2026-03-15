import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getEntries, removeEntry } from '../utils/storage';
import { TravelEntry } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreenProps } from '../navigation/props';
import { ConfirmDeleteModal } from '../components/Base/ConfirmDeleteModal';

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);

  const loadEntries = async () => {
    const data = await getEntries();
    setEntries(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const handleDelete = async (id: string) => {
    try {
      await removeEntry(id);
      loadEntries();
    } catch {
      Alert.alert('Delete failed', 'Could not remove entry right now. Please try again.');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No Entries yet.
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Tap the + below to capture a new memory.
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: TravelEntry }) => {
    const date = new Date(item.timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={[styles.cardDate, { color: colors.primary }]}>{date}</Text>
          <Text style={[styles.cardLocation, { color: colors.text }]} numberOfLines={2}>
            {item.location.address || `${item.location.latitude.toFixed(2)}, ${item.location.longitude.toFixed(2)}`}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => setEntryIdToDelete(item.id)}
        >
          <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmptyState}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddEntry')}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <ConfirmDeleteModal
        visible={Boolean(entryIdToDelete)}
        title="Remove memory?"
        message="This travel memory will be removed from your diary and cannot be restored."
        accentColor={colors.primary}
        backgroundColor={colors.card}
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
        borderColor={colors.border}
        onCancel={() => setEntryIdToDelete(null)}
        onConfirm={async () => {
          if (!entryIdToDelete) {
            return;
          }

          await handleDelete(entryIdToDelete);
          setEntryIdToDelete(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  emptyList: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 24, marginTop: 16 },
  emptySubtext: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 8, textAlign: 'center' },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    padding: 12,
  },
  cardImage: { width: '100%', height: 220, borderRadius: 16 },
  cardContent: { paddingTop: 16, paddingHorizontal: 4 },
  cardDate: { fontFamily: 'Inter_600SemiBold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  cardLocation: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 18 },
  deleteButton: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});