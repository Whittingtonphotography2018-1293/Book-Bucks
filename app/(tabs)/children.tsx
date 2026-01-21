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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Child, RewardSettings } from '@/types/database';
import { Plus, Edit, Trash2, DollarSign, Trophy, X } from 'lucide-react-native';

const AVATAR_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];

const formatGradeLevel = (grade: number): string => {
  return grade === 0 ? 'K' : grade.toString();
};

const parseGradeLevel = (input: string): number | null => {
  const trimmed = input.trim().toUpperCase();
  if (trimmed === 'K') return 0;
  const parsed = parseInt(trimmed);
  if (isNaN(parsed)) return null;
  return parsed;
};

export default function ChildrenScreen() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [rewardType, setRewardType] = useState<'money' | 'points'>('money');
  const [amountPerBook, setAmountPerBook] = useState('1.00');
  const [payoutThreshold, setPayoutThreshold] = useState('10.00');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

  const fetchChildren = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const openAddModal = () => {
    setEditingChild(null);
    setName('');
    setGradeLevel('');
    setRewardType('money');
    setAmountPerBook('1.00');
    setPayoutThreshold('10.00');
    setSelectedColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setModalVisible(true);
  };

  const openEditModal = async (child: Child) => {
    setEditingChild(child);
    setName(child.name);
    setGradeLevel(formatGradeLevel(child.grade_level));
    setSelectedColor(child.avatar_color);

    const { data: settings } = await supabase
      .from('reward_settings')
      .select('*')
      .eq('child_id', child.id)
      .maybeSingle();

    if (settings) {
      setRewardType(settings.reward_type);
      setAmountPerBook(settings.amount_per_book.toString());
      setPayoutThreshold(settings.payout_threshold.toString());
    } else {
      setRewardType('money');
      setAmountPerBook('1.00');
      setPayoutThreshold('10.00');
    }

    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a child');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!gradeLevel.trim()) {
      Alert.alert('Error', 'Please enter a grade level');
      return;
    }

    const grade = parseGradeLevel(gradeLevel);
    if (grade === null || grade < 0 || grade > 12) {
      Alert.alert('Error', 'Grade level must be between K and 12');
      return;
    }

    const amount = parseFloat(amountPerBook);
    const threshold = parseFloat(payoutThreshold);

    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount per book');
      return;
    }

    if (isNaN(threshold) || threshold < 0) {
      Alert.alert('Error', 'Please enter a valid payout threshold');
      return;
    }

    setSaving(true);
    Keyboard.dismiss();

    try {
      if (editingChild) {
        const { error: updateError } = await supabase
          .from('children')
          .update({
            name: name.trim(),
            grade_level: grade,
            avatar_color: selectedColor,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingChild.id);

        if (updateError) {
          console.error('Update child error:', updateError);
          throw new Error(updateError.message || 'Failed to update child');
        }

        const { error: settingsError } = await supabase
          .from('reward_settings')
          .upsert(
            {
              child_id: editingChild.id,
              reward_type: rewardType,
              amount_per_book: amount,
              payout_threshold: threshold,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'child_id' }
          );

        if (settingsError) {
          console.error('Update settings error:', settingsError);
          throw new Error(settingsError.message || 'Failed to update reward settings');
        }
      } else {
        const { data: newChild, error: insertError } = await supabase
          .from('children')
          .insert({
            parent_id: user.id,
            name: name.trim(),
            grade_level: grade,
            avatar_color: selectedColor,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Insert child error:', insertError);
          throw new Error(insertError.message || 'Failed to create child');
        }

        if (!newChild) {
          throw new Error('No child data returned after insert');
        }

        const { error: settingsError } = await supabase
          .from('reward_settings')
          .insert({
            child_id: newChild.id,
            reward_type: rewardType,
            amount_per_book: amount,
            payout_threshold: threshold,
          });

        if (settingsError) {
          console.error('Insert settings error:', settingsError);
          throw new Error(settingsError.message || 'Failed to create reward settings');
        }
      }

      setModalVisible(false);
      await fetchChildren();
    } catch (error: any) {
      console.error('Save error details:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save child. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (child: Child) => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to delete ${child.name}? This will remove all their books and progress.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('children')
                .delete()
                .eq('id', child.id);

              if (error) {
                console.error('Delete error:', error);
                throw error;
              }

              await fetchChildren();
            } catch (error: any) {
              console.error('Delete error details:', error);
              Alert.alert('Error', error.message || 'Failed to delete child');
            }
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Children</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Child</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {children.map((child) => (
          <View key={child.id} style={styles.childCard}>
            <View style={[styles.avatar, { backgroundColor: child.avatar_color }]}>
              <Text style={styles.avatarText}>{child.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childGrade}>Grade {formatGradeLevel(child.grade_level)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(child)}
              >
                <Edit size={20} color="#2E7D32" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(child)}
              >
                <Trash2 size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingChild ? 'Edit Child' : 'Add Child'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} disabled={saving}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter child's name"
            />

            <Text style={styles.label}>Grade Level</Text>
            <TextInput
              style={styles.input}
              value={gradeLevel}
              onChangeText={setGradeLevel}
              placeholder="K-12"
            />

            <Text style={styles.label}>Avatar Color</Text>
            <View style={styles.colorPicker}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Reward Settings</Text>

            <Text style={styles.label}>Reward Type</Text>
            <View style={styles.rewardTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.rewardTypeButton,
                  rewardType === 'money' && styles.rewardTypeButtonActive,
                ]}
                onPress={() => setRewardType('money')}
              >
                <DollarSign
                  size={20}
                  color={rewardType === 'money' ? '#FFF' : '#666'}
                />
                <Text
                  style={[
                    styles.rewardTypeText,
                    rewardType === 'money' && styles.rewardTypeTextActive,
                  ]}
                >
                  Money
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rewardTypeButton,
                  rewardType === 'points' && styles.rewardTypeButtonActive,
                ]}
                onPress={() => setRewardType('points')}
              >
                <Trophy
                  size={20}
                  color={rewardType === 'points' ? '#FFF' : '#666'}
                />
                <Text
                  style={[
                    styles.rewardTypeText,
                    rewardType === 'points' && styles.rewardTypeTextActive,
                  ]}
                >
                  Points
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              {rewardType === 'money' ? 'Amount per Book ($)' : 'Points per Book'}
            </Text>
            <TextInput
              style={styles.input}
              value={amountPerBook}
              onChangeText={setAmountPerBook}
              placeholder="1.00"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>
              {rewardType === 'money'
                ? 'Payout Threshold ($)'
                : 'Points to Redeem'}
            </Text>
            <TextInput
              style={styles.input}
              value={payoutThreshold}
              onChangeText={setPayoutThreshold}
              placeholder="10.00"
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingChild ? 'Update' : 'Add Child'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: '#2E7D32',
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA726',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  childGrade: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#2E7D32',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  rewardTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
  },
  rewardTypeButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  rewardTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  rewardTypeTextActive: {
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#FFA726',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#FFCC80',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
