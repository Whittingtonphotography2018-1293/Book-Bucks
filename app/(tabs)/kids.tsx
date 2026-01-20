import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Child, Book, RewardSettings, Achievement } from '@/types/database';
import { BookOpen, Plus, X, Star, Award, TrendingUp } from 'lucide-react-native';
import { fetchBookInfo } from '@/lib/bookInfo';

export default function KidsScreen() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [rewardSettings, setRewardSettings] = useState<RewardSettings | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookSummary, setBookSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setChildren(data);
        if (!selectedChild) {
          setSelectedChild(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async () => {
    if (!selectedChild) return;

    try {
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('created_at', { ascending: false });

      const { data: settingsData } = await supabase
        .from('reward_settings')
        .select('*')
        .eq('child_id', selectedChild.id)
        .maybeSingle();

      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('earned_at', { ascending: false });

      setBooks(booksData || []);
      setRewardSettings(settingsData);
      setAchievements(achievementsData || []);
    } catch (error) {
      console.error('Error fetching child data:', error);
    }
  };

  const handleAddBook = async () => {
    if (!bookTitle.trim() || !bookAuthor.trim() || !bookSummary.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!selectedChild) {
      console.error('No child selected');
      Alert.alert('Error', 'Please select a child');
      return;
    }

    setSubmitting(true);

    try {
      console.log('Fetching book info for:', bookTitle, bookAuthor);
      const bookInfo = await fetchBookInfo(bookTitle.trim(), bookAuthor.trim());

      console.log('Submitting book:', {
        child_id: selectedChild.id,
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        reading_level: bookInfo.readingLevel,
        interest_level: bookInfo.interestLevel,
      });

      const { data, error } = await supabase.from('books').insert({
        child_id: selectedChild.id,
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        summary: bookSummary.trim(),
        cover_url: bookInfo.coverUrl,
        reading_level: bookInfo.readingLevel,
        interest_level: bookInfo.interestLevel,
        status: 'pending',
      }).select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Book submitted successfully:', data);
      showConfetti();

      setBookTitle('');
      setBookAuthor('');
      setBookSummary('');
      setModalVisible(false);
      await fetchChildData();

      const levelInfo = bookInfo.readingLevel
        ? `\n\nReading Level: ${bookInfo.readingLevel}`
        : '';
      Alert.alert('Success!', `Your book has been submitted for approval!${levelInfo}`);
    } catch (error: any) {
      console.error('handleAddBook error:', error);
      Alert.alert('Error', error.message || 'Failed to submit book');
    } finally {
      setSubmitting(false);
    }
  };

  const showConfetti = () => {
    confettiAnim.setValue(0);
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <BookOpen size={64} color="#CCC" />
        <Text style={styles.emptyTitle}>No Children Added</Text>
        <Text style={styles.emptyText}>
          Ask your parent to add you in the Children tab!
        </Text>
      </View>
    );
  }

  const approvedBooks = books.filter((b) => b.status === 'approved');
  const pendingBooks = books.filter((b) => b.status === 'pending');
  const totalEarned = approvedBooks.length * (rewardSettings?.amount_per_book || 0);
  const progressPercentage = rewardSettings
    ? (totalEarned / rewardSettings.payout_threshold) * 100
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kids View</Text>
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.childSelector}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childButton,
                    selectedChild?.id === child.id && styles.childButtonActive,
                  ]}
                  onPress={() => setSelectedChild(child)}
                >
                  <Text
                    style={[
                      styles.childButtonText,
                      selectedChild?.id === child.id && styles.childButtonTextActive,
                    ]}
                  >
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {selectedChild && (
        <ScrollView style={styles.content}>
          <View style={styles.heroCard}>
            <View
              style={[styles.heroAvatar, { backgroundColor: selectedChild.avatar_color }]}
            >
              <Text style={styles.heroAvatarText}>
                {selectedChild.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heroName}>{selectedChild.name}'s Reading Journey</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <BookOpen size={24} color="#2E7D32" />
                <Text style={styles.statNumber}>{approvedBooks.length}</Text>
                <Text style={styles.statLabel}>Books Read</Text>
              </View>
              <View style={styles.statItem}>
                <Star size={24} color="#FFA726" />
                <Text style={styles.statNumber}>
                  {rewardSettings?.reward_type === 'money'
                    ? `$${totalEarned.toFixed(2)}`
                    : `${totalEarned}`}
                </Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
            </View>

            {rewardSettings && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    Progress to {rewardSettings.reward_type === 'money' ? '$' : ''}
                    {rewardSettings.payout_threshold}
                    {rewardSettings.reward_type === 'points' ? ' pts' : ''}
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {Math.min(progressPercentage, 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progressPercentage, 100)}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.addBookButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color="#FFF" />
              <Text style={styles.addBookButtonText}>Log a Book</Text>
            </TouchableOpacity>
          </View>

          {achievements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Award size={20} color="#FFA726" /> Achievements
              </Text>
              <View style={styles.achievementsGrid}>
                {achievements.slice(0, 4).map((achievement) => (
                  <View key={achievement.id} style={styles.achievementBadge}>
                    <Award size={24} color="#FFA726" />
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {pendingBooks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Waiting for Approval</Text>
              {pendingBooks.map((book) => (
                <View key={book.id} style={styles.bookCard}>
                  <View style={styles.bookIcon}>
                    <BookOpen size={20} color="#FFA726" />
                  </View>
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>by {book.author}</Text>
                    {book.reading_level && (
                      <Text style={styles.bookReadingLevel}>{book.reading_level}</Text>
                    )}
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {approvedBooks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <TrendingUp size={20} color="#2E7D32" /> Approved Books
              </Text>
              {approvedBooks.map((book) => (
                <View key={book.id} style={styles.bookCard}>
                  <View style={[styles.bookIcon, { backgroundColor: '#E8F5E9' }]}>
                    <BookOpen size={20} color="#2E7D32" />
                  </View>
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>by {book.author}</Text>
                    {book.reading_level && (
                      <Text style={styles.bookReadingLevel}>{book.reading_level}</Text>
                    )}
                  </View>
                  <View style={styles.approvedBadge}>
                    <Text style={styles.approvedText}>
                      +{rewardSettings?.reward_type === 'money' ? '$' : ''}
                      {rewardSettings?.amount_per_book || 0}
                      {rewardSettings?.reward_type === 'points' ? ' pts' : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log a Book</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Book Title</Text>
            <TextInput
              style={styles.input}
              value={bookTitle}
              onChangeText={setBookTitle}
              placeholder="Harry Potter and the Sorcerer's Stone"
            />

            <Text style={styles.label}>Author</Text>
            <TextInput
              style={styles.input}
              value={bookAuthor}
              onChangeText={setBookAuthor}
              placeholder="J.K. Rowling"
            />

            <Text style={styles.label}>Short Summary</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bookSummary}
              onChangeText={setBookSummary}
              placeholder="Tell us what the book was about..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleAddBook}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                    Checking reading level...
                  </Text>
                </>
              ) : (
                <Text style={styles.submitButtonText}>Submit for Approval</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F9F5',
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
  header: {
    backgroundColor: '#2E7D32',
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  childSelector: {
    flexDirection: 'row',
  },
  childButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  childButtonActive: {
    backgroundColor: '#FFF',
  },
  childButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  childButtonTextActive: {
    color: '#2E7D32',
  },
  content: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroAvatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '700',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  addBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA726',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addBookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementTitle: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bookIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bookReadingLevel: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  approvedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#FFA726',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
