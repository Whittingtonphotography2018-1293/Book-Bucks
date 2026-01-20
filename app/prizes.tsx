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
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Prize, Child } from '@/types/database';
import { ArrowLeft, Plus, Edit, Trash2, Gift, X } from 'lucide-react-native';

interface PrizeWithChild extends Prize {
  child?: Child;
}

export default function PrizesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [prizes, setPrizes] = useState<PrizeWithChild[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  const [prizeName, setPrizeName] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('10');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id)
        .order('name', { ascending: true });

      setChildren(childrenData || []);

      const { data: prizesData } = await supabase
        .from('prizes')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (prizesData) {
        const prizesWithChildren = prizesData.map((prize) => ({
          ...prize,
          child: childrenData?.find((c) => c.id === prize.child_id),
        }));
        setPrizes(prizesWithChildren);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPrize(null);
    setPrizeName('');
    setPrizeDescription('');
    setPointsRequired('10');
    setSelectedChildId(null);
    setModalVisible(true);
  };

  const openEditModal = (prize: Prize) => {
    setEditingPrize(prize);
    setPrizeName(prize.name);
    setPrizeDescription(prize.description);
    setPointsRequired(prize.points_required.toString());
    setSelectedChildId(prize.child_id || null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!prizeName.trim()) {
      Alert.alert('Error', 'Please enter a prize name');
      return;
    }

    const points = parseFloat(pointsRequired);
    if (isNaN(points) || points < 0) {
      Alert.alert('Error', 'Please enter a valid points value');
      return;
    }

    try {
      if (editingPrize) {
        const { error } = await supabase
          .from('prizes')
          .update({
            name: prizeName.trim(),
            description: prizeDescription.trim(),
            points_required: points,
            child_id: selectedChildId,
          })
          .eq('id', editingPrize.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('prizes').insert({
          parent_id: user!.id,
          name: prizeName.trim(),
          description: prizeDescription.trim(),
          points_required: points,
          child_id: selectedChildId,
        });

        if (error) throw error;
      }

      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (prize: Prize) => {
    Alert.alert('Delete Prize', `Are you sure you want to delete "${prize.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('prizes').delete().eq('id', prize.id);

            if (error) throw error;
            fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleToggleRedeemed = async (prize: Prize) => {
    try {
      const { error } = await supabase
        .from('prizes')
        .update({ is_redeemed: !prize.is_redeemed })
        .eq('id', prize.id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
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
        <Text style={styles.headerTitle}>Manage Prizes</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {prizes.length === 0 ? (
          <View style={styles.emptyState}>
            <Gift size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Prizes Yet</Text>
            <Text style={styles.emptyText}>
              Create custom prizes for your children to work towards!
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Add Prize</Text>
            </TouchableOpacity>
          </View>
        ) : (
          prizes.map((prize) => (
            <View
              key={prize.id}
              style={[styles.prizeCard, prize.is_redeemed && styles.prizeCardRedeemed]}
            >
              <View style={styles.prizeHeader}>
                <View style={styles.prizeIcon}>
                  <Gift size={24} color={prize.is_redeemed ? '#999' : '#FFA726'} />
                </View>
                <View style={styles.prizeInfo}>
                  <Text
                    style={[styles.prizeName, prize.is_redeemed && styles.prizeNameRedeemed]}
                  >
                    {prize.name}
                  </Text>
                  {prize.description && (
                    <Text style={styles.prizeDescription}>{prize.description}</Text>
                  )}
                  <View style={styles.prizeMetaRow}>
                    <Text style={styles.prizePoints}>{prize.points_required} points</Text>
                    {prize.child && (
                      <Text style={styles.prizeChild}>For {prize.child.name}</Text>
                    )}
                    {!prize.child && (
                      <Text style={styles.prizeChild}>All children</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.prizeActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleRedeemed(prize)}
                >
                  <Text style={styles.actionButtonTextSmall}>
                    {prize.is_redeemed ? 'Unredeemed' : 'Mark Redeemed'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(prize)}
                >
                  <Edit size={16} color="#2E7D32" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(prize)}
                >
                  <Trash2 size={16} color="#F44336" />
                </TouchableOpacity>
              </View>

              {prize.is_redeemed && (
                <View style={styles.redeemedBanner}>
                  <Text style={styles.redeemedText}>Redeemed</Text>
                </View>
              )}
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingPrize ? 'Edit Prize' : 'Add Prize'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Prize Name</Text>
            <TextInput
              style={styles.input}
              value={prizeName}
              onChangeText={setPrizeName}
              placeholder="Ice cream night, New toy, etc."
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={prizeDescription}
              onChangeText={setPrizeDescription}
              placeholder="Add more details about this prize..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Points Required</Text>
            <TextInput
              style={styles.input}
              value={pointsRequired}
              onChangeText={setPointsRequired}
              placeholder="10"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Available For</Text>
            <View style={styles.childSelector}>
              <TouchableOpacity
                style={[
                  styles.childOption,
                  selectedChildId === null && styles.childOptionSelected,
                ]}
                onPress={() => setSelectedChildId(null)}
              >
                <Text
                  style={[
                    styles.childOptionText,
                    selectedChildId === null && styles.childOptionTextSelected,
                  ]}
                >
                  All Children
                </Text>
              </TouchableOpacity>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childOption,
                    selectedChildId === child.id && styles.childOptionSelected,
                  ]}
                  onPress={() => setSelectedChildId(child.id)}
                >
                  <Text
                    style={[
                      styles.childOptionText,
                      selectedChildId === child.id && styles.childOptionTextSelected,
                    ]}
                  >
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingPrize ? 'Update Prize' : 'Add Prize'}
              </Text>
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
  prizeCard: {
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
  prizeCardRedeemed: {
    opacity: 0.6,
  },
  prizeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  prizeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prizeInfo: {
    flex: 1,
  },
  prizeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  prizeNameRedeemed: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  prizeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  prizeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prizePoints: {
    fontSize: 14,
    color: '#FFA726',
    fontWeight: '600',
    marginRight: 12,
  },
  prizeChild: {
    fontSize: 12,
    color: '#999',
  },
  prizeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F9F5',
  },
  actionButtonTextSmall: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  redeemedBanner: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  redeemedText: {
    color: '#FFF',
    fontSize: 12,
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
    minHeight: 80,
  },
  childSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#DDD',
  },
  childOptionSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  childOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  childOptionTextSelected: {
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
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
