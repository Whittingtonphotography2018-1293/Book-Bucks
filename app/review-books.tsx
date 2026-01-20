import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Child, Achievement } from '@/types/database';
import { ArrowLeft, Check, X, BookOpen, Award } from 'lucide-react-native';

interface BookWithChild extends Book {
  child?: Child;
}

const ACHIEVEMENTS = [
  { count: 1, type: 'first_book', title: 'First Book!', description: 'Read your first book' },
  { count: 5, type: 'milestone_5', title: 'Reading Rookie', description: 'Read 5 books' },
  { count: 10, type: 'milestone_10', title: 'Page Turner', description: 'Read 10 books' },
  { count: 25, type: 'milestone_25', title: 'Book Worm', description: 'Read 25 books' },
  { count: 50, type: 'milestone_50', title: 'Reading Master', description: 'Read 50 books' },
  { count: 100, type: 'milestone_100', title: 'Book Legend', description: 'Read 100 books!' },
];

export default function ReviewBooksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<BookWithChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookWithChild | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchPendingBooks();
  }, [user]);

  const fetchPendingBooks = async () => {
    if (!user) return;

    try {
      const { data: children } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (children) {
        const childIds = children.map((c) => c.id);
        const { data: booksData } = await supabase
          .from('books')
          .select('*')
          .in('child_id', childIds)
          .eq('status', 'pending')
          .order('submitted_at', { ascending: true });

        if (booksData) {
          const booksWithChildren = booksData.map((book) => ({
            ...book,
            child: children.find((c) => c.id === book.child_id),
          }));
          setBooks(booksWithChildren);
        }
      }
    } catch (error) {
      console.error('Error fetching pending books:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardAchievements = async (childId: string) => {
    try {
      const { data: approvedBooks } = await supabase
        .from('books')
        .select('*')
        .eq('child_id', childId)
        .eq('status', 'approved');

      const bookCount = approvedBooks?.length || 0;

      const { data: existingAchievements } = await supabase
        .from('achievements')
        .select('achievement_type')
        .eq('child_id', childId);

      const existingTypes = new Set(existingAchievements?.map((a) => a.achievement_type) || []);

      const newAchievements = ACHIEVEMENTS.filter(
        (achievement) =>
          bookCount >= achievement.count && !existingTypes.has(achievement.type)
      );

      if (newAchievements.length > 0) {
        const achievementsToInsert = newAchievements.map((achievement) => ({
          child_id: childId,
          achievement_type: achievement.type,
          title: achievement.title,
          description: achievement.description,
        }));

        await supabase.from('achievements').insert(achievementsToInsert);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const handleApprove = async (book: BookWithChild) => {
    try {
      const { error } = await supabase
        .from('books')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', book.id);

      if (error) throw error;

      await checkAndAwardAchievements(book.child_id);

      Alert.alert('Success', `"${book.title}" has been approved!`);
      fetchPendingBooks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleReject = (book: BookWithChild) => {
    Alert.alert(
      'Reject Book',
      `Are you sure you want to reject "${book.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('books')
                .update({ status: 'rejected' })
                .eq('id', book.id);

              if (error) throw error;
              fetchPendingBooks();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const openBookDetails = (book: BookWithChild) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Books</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
              No books are waiting for your approval.
            </Text>
          </View>
        ) : (
          books.map((book) => (
            <View key={book.id} style={styles.bookCard}>
              <TouchableOpacity
                style={styles.bookContent}
                onPress={() => openBookDetails(book)}
              >
                <View
                  style={[
                    styles.bookAvatar,
                    { backgroundColor: book.child?.avatar_color || '#4CAF50' },
                  ]}
                >
                  <Text style={styles.bookAvatarText}>
                    {book.child?.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>by {book.author}</Text>
                  {book.reading_level && (
                    <Text style={styles.bookReadingLevel}>{book.reading_level}</Text>
                  )}
                  <Text style={styles.bookChild}>Submitted by {book.child?.name}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.bookActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(book)}
                >
                  <Check size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(book)}
                >
                  <X size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedBook && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue}>{selectedBook.title}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Author</Text>
                <Text style={styles.detailValue}>{selectedBook.author}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Child</Text>
                <Text style={styles.detailValue}>{selectedBook.child?.name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Summary</Text>
                <Text style={styles.detailValue}>{selectedBook.summary}</Text>
              </View>

              {selectedBook.reading_level && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reading Level</Text>
                  <Text style={[styles.detailValue, { color: '#4CAF50', fontWeight: '600' }]}>
                    {selectedBook.reading_level}
                  </Text>
                </View>
              )}

              {selectedBook.interest_level && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Interest Level</Text>
                  <Text style={styles.detailValue}>{selectedBook.interest_level}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.approveButton]}
                  onPress={() => {
                    setModalVisible(false);
                    handleApprove(selectedBook);
                  }}
                >
                  <Check size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.rejectButton]}
                  onPress={() => {
                    setModalVisible(false);
                    handleReject(selectedBook);
                  }}
                >
                  <X size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2E7D32',
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bookCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bookAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookReadingLevel: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  bookChild: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  bookActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F9F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#2E7D32',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  detailRow: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
});
