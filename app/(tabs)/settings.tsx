import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, Book } from '@/types/database';
import { User, LogOut, Bell, BookCheck, Gift, Trash2 } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pendingBooksCount, setPendingBooksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchPendingBooks();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBooks = async () => {
    if (!user) return;

    try {
      const { data: children } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', user.id);

      if (children) {
        const childIds = children.map((c) => c.id);
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .in('child_id', childIds)
          .eq('status', 'pending');

        setPendingBooksCount(books?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching pending books:', error);
    }
  };

  const handleSignOut = () => {
    console.log('Sign out button pressed');

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        performSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performSignOut,
        },
      ]);
    }
  };

  const performSignOut = async () => {
    try {
      console.log('Performing sign out...');
      setLoading(true);
      await signOut();
      console.log('Sign out successful, navigating to login...');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
      if (Platform.OS === 'web') {
        window.alert('Unable to sign out. Please try again.');
      } else {
        Alert.alert('Error', 'Unable to sign out. Please try again.');
      }
    }
  };

  const handleDeleteAccount = () => {
    console.log('Delete account button pressed');

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete your account? This will permanently delete all your data, including all children, books, achievements, and prizes. This action cannot be undone.')) {
        if (window.confirm('This is your last chance. Are you absolutely sure you want to delete your account and all associated data?')) {
          performDeleteAccount();
        }
      }
    } else {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This will permanently delete all your data, including all children, books, achievements, and prizes. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Final Confirmation',
                'This is your last chance. Are you absolutely sure you want to delete your account and all associated data?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: performDeleteAccount,
                  },
                ]
              );
            },
          },
        ]
      );
    }
  };

  const performDeleteAccount = async () => {
    try {
      console.log('Performing account deletion...');
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session');
      }

      console.log('Calling delete account edge function...');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete account failed:', errorData);
        throw new Error('Failed to delete account');
      }

      console.log('Account deleted successfully');
      await signOut();
      router.replace('/auth/login');

      if (Platform.OS === 'web') {
        window.alert('Your account and all data have been permanently deleted.');
      } else {
        Alert.alert('Success', 'Your account and all data have been permanently deleted.');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setLoading(false);
      if (Platform.OS === 'web') {
        window.alert('Unable to delete account. Please contact support.');
      } else {
        Alert.alert('Error', 'Unable to delete account. Please contact support.');
      }
    }
  };

  const handleReviewBooks = () => {
    router.push('/review-books');
  };

  const handleManagePrizes = () => {
    router.push('/prizes');
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
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <User size={32} color="#2E7D32" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parent Actions</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleReviewBooks}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
                <BookCheck size={20} color="#2E7D32" />
              </View>
              <Text style={styles.menuItemText}>Review Books</Text>
            </View>
            {pendingBooksCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingBooksCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleManagePrizes}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                <Gift size={20} color="#FFA726" />
              </View>
              <Text style={styles.menuItemText}>Manage Prizes</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
                <LogOut size={20} color="#F44336" />
              </View>
              <Text style={[styles.menuItemText, { color: '#F44336' }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
                <Trash2 size={20} color="#D32F2F" />
              </View>
              <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerText}>BookBucks v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Making reading fun, one book at a time!
          </Text>
        </View>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerLogo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
});
