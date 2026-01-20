import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ChildWithStats } from '@/types/database';
import { BookOpen, TrendingUp, Clock, Award } from 'lucide-react-native';

const formatGradeLevel = (grade: number): string => {
  return grade === 0 ? 'K' : grade.toString();
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<ChildWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChildren = async () => {
    if (!user) return;

    try {
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (childrenError) throw childrenError;

      if (childrenData) {
        const childrenWithStats = await Promise.all(
          childrenData.map(async (child) => {
            const { data: books } = await supabase
              .from('books')
              .select('*')
              .eq('child_id', child.id);

            const { data: rewardSettings } = await supabase
              .from('reward_settings')
              .select('*')
              .eq('child_id', child.id)
              .maybeSingle();

            const totalBooks = books?.length || 0;
            const approvedBooks = books?.filter((b) => b.status === 'approved').length || 0;
            const pendingBooks = books?.filter((b) => b.status === 'pending').length || 0;
            const totalEarned = approvedBooks * (rewardSettings?.amount_per_book || 0);

            return {
              ...child,
              total_books: totalBooks,
              approved_books: approvedBooks,
              pending_books: pendingBooks,
              total_earned: totalEarned,
              reward_settings: rewardSettings || undefined,
            };
          })
        );

        setChildren(childrenWithStats);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChildren();
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
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerSubtitle}>Track your children's reading progress</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Children Added Yet</Text>
            <Text style={styles.emptyText}>
              Get started by adding your first child in the Children tab!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/children')}
            >
              <Text style={styles.emptyButtonText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.childrenList}>
            {children.map((child) => (
              <View key={child.id} style={styles.childCard}>
                <View style={styles.childHeader}>
                  <View
                    style={[
                      styles.childAvatar,
                      { backgroundColor: child.avatar_color },
                    ]}
                  >
                    <Text style={styles.childAvatarText}>
                      {child.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childGrade}>Grade {formatGradeLevel(child.grade_level)}</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <BookOpen size={20} color="#2E7D32" />
                    <Text style={styles.statValue}>{child.approved_books}</Text>
                    <Text style={styles.statLabel}>Books Read</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Clock size={20} color="#FFA726" />
                    <Text style={styles.statValue}>{child.pending_books}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>

                  <View style={styles.statBox}>
                    <TrendingUp size={20} color="#4CAF50" />
                    <Text style={styles.statValue}>
                      {child.reward_settings?.reward_type === 'money'
                        ? `$${child.total_earned.toFixed(2)}`
                        : `${child.total_earned} pts`}
                    </Text>
                    <Text style={styles.statLabel}>Earned</Text>
                  </View>
                </View>

                {child.pending_books > 0 && (
                  <View style={styles.pendingAlert}>
                    <Award size={16} color="#FFA726" />
                    <Text style={styles.pendingText}>
                      {child.pending_books} book{child.pending_books !== 1 ? 's' : ''} waiting for approval
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    backgroundColor: '#2E7D32',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  childrenList: {
    padding: 16,
  },
  childCard: {
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
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  childGrade: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F9F5',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  pendingText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    fontWeight: '500',
  },
});
