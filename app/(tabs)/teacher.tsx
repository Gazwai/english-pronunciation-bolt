import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CreditCard as Edit3, Trash2, Users, BookOpen, X } from 'lucide-react-native';
import { dataService } from '../../services/dataService';
import { WordList, Word } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

export default function TeacherDashboard() {
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWordList, setEditingWordList] = useState<WordList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newWords, setNewWords] = useState('');

  useEffect(() => {
    loadWordLists();
  }, []);

  const loadWordLists = () => {
    const lists = dataService.getWordLists();
    setWordLists(lists);
  };

  const handleCreateWordList = () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a name for the word list');
      return;
    }

    if (!newWords.trim()) {
      Alert.alert('Error', 'Please enter some words');
      return;
    }

    const wordsArray = newWords
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((word, index) => ({
        id: `${Date.now()}_${index}`,
        text: word.toLowerCase(),
        phonetic: `/${word.toLowerCase()}/`, // Simplified phonetic
        difficulty: 'medium' as const,
        category: 'custom',
      }));

    try {
      dataService.createWordList({
        name: newListName,
        description: newListDescription || 'Custom word list',
        words: wordsArray,
      });

      setNewListName('');
      setNewListDescription('');
      setNewWords('');
      setShowCreateModal(false);
      loadWordLists();
      Alert.alert('Success', 'Word list created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create word list');
    }
  };

  const handleEditWordList = () => {
    if (!editingWordList || !newListName.trim()) {
      Alert.alert('Error', 'Please enter a name for the word list');
      return;
    }

    if (!newWords.trim()) {
      Alert.alert('Error', 'Please enter some words');
      return;
    }

    const wordsArray = newWords
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((word, index) => ({
        id: `${Date.now()}_${index}`,
        text: word.toLowerCase(),
        phonetic: `/${word.toLowerCase()}/`,
        difficulty: 'medium' as const,
        category: 'custom',
      }));

    try {
      dataService.updateWordList(editingWordList.id, {
        name: newListName,
        description: newListDescription || 'Custom word list',
        words: wordsArray,
      });

      resetEditForm();
      setShowEditModal(false);
      loadWordLists();
      Alert.alert('Success', 'Word list updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update word list');
    }
  };

  const handleDeleteWordList = (wordList: WordList) => {
    Alert.alert(
      'Delete Word List',
      `Are you sure you want to delete "${wordList.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dataService.deleteWordList(wordList.id);
            loadWordLists();
            Alert.alert('Success', 'Word list deleted successfully!');
          },
        },
      ]
    );
  };

  const openEditModal = (wordList: WordList) => {
    setEditingWordList(wordList);
    setNewListName(wordList.name);
    setNewListDescription(wordList.description);
    setNewWords(wordList.words.map(word => word.text).join('\n'));
    setShowEditModal(true);
  };

  const resetCreateForm = () => {
    setNewListName('');
    setNewListDescription('');
    setNewWords('');
  };

  const resetEditForm = () => {
    setEditingWordList(null);
    setNewListName('');
    setNewListDescription('');
    setNewWords('');
  };

  const renderWordList = (wordList: WordList) => (
    <View key={wordList.id} style={styles.wordListCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{wordList.name}</Text>
          <Text style={styles.cardSubtitle}>{wordList.description}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(wordList)}
          >
            <Edit3 size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteWordList(wordList)}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <BookOpen size={16} color="#64748B" />
          <Text style={styles.statText}>{wordList.words.length} words</Text>
        </View>
        <View style={styles.stat}>
          <Users size={16} color="#64748B" />
          <Text style={styles.statText}>Active</Text>
        </View>
      </View>

      <View style={styles.wordPreview}>
        <Text style={styles.previewTitle}>Words:</Text>
        <Text style={styles.previewText} numberOfLines={2}>
          {wordList.words.map(word => word.text).join(', ')}
        </Text>
      </View>
    </View>
  );

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    onSubmit: () => void,
    title: string,
    submitText: string
  ) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.textInput}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Enter word list name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              value={newListDescription}
              onChangeText={setNewListDescription}
              placeholder="Enter description (optional)"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Words *</Text>
            <Text style={styles.inputHint}>Enter one word per line</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newWords}
              onChangeText={setNewWords}
              placeholder="apple&#10;banana&#10;orange&#10;..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={onSubmit}
          >
            <Text style={styles.submitButtonText}>{submitText}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Teacher Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage word lists and track student progress</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Word Lists</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.createButtonText}>Create New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.wordListsContainer} showsVerticalScrollIndicator={false}>
          {wordLists.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No word lists yet</Text>
              <Text style={styles.emptySubtext}>Create your first word list to get started</Text>
            </View>
          ) : (
            wordLists.map(renderWordList)
          )}
        </ScrollView>
      </View>

      {renderModal(
        showCreateModal,
        () => setShowCreateModal(false),
        handleCreateWordList,
        'Create Word List',
        'Create'
      )}

      {renderModal(
        showEditModal,
        () => {
          setShowEditModal(false);
          resetEditForm();
        },
        handleEditWordList,
        'Edit Word List',
        'Update'
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#D1FAE5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  wordListsContainer: {
    flex: 1,
  },
  wordListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  wordPreview: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});