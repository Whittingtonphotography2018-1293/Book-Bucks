import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, BookOpen, DollarSign, PartyPopper, Settings, CheckCircle2, TrendingUp } from 'lucide-react-native';

interface Step {
  number: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function HowItWorksScreen() {
  const router = useRouter();

  const steps: Step[] = [
    {
      number: '1',
      emoji: '⚙️',
      title: 'Set',
      subtitle: 'Parents control all rewards and values',
      description: [
        'You decide the reward type: money (any amount you choose), prizes, treats, or experiences.',
        'You set the value per book and when rewards are earned.',
        "Set your child's grade level to track age-appropriate reading.",
      ],
      icon: <Settings size={32} color="#2E7D32" />,
      color: '#2E7D32',
      bgColor: '#E8F5E9',
    },
    {
      number: '2',
      emoji: '📖',
      title: 'Read',
      subtitle: 'Kids read books at their grade level',
      description: [
        'After finishing a book, they log the title and short review.',
        'Parents quickly approve it — easy!',
      ],
      icon: <BookOpen size={32} color="#1976D2" />,
      color: '#1976D2',
      bgColor: '#E3F2FD',
    },
    {
      number: '3',
      emoji: '💰',
      title: 'Earn',
      subtitle: 'Each book adds up rewards',
      description: [
        'Every approved book earns BookBucks (money or points).',
        'The more they read, the more they earn!',
      ],
      icon: <TrendingUp size={32} color="#F57C00" />,
      color: '#F57C00',
      bgColor: '#FFF3E0',
    },
    {
      number: '4',
      emoji: '🎉',
      title: 'Celebrate',
      subtitle: 'Hit goals and unlock rewards!',
      description: [
        'When kids reach their goal, you decide when and how to give the reward.',
        'Give whatever you promised — money, prizes, treats, or special time together.',
        'BookBucks simply tracks progress. You control everything else!',
      ],
      icon: <PartyPopper size={32} color="#7B1FA2" />,
      color: '#7B1FA2',
      bgColor: '#F3E5F5',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How It Works</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>How BookBucks Works</Text>
          <Text style={styles.heroSubtitle}>
            A simple tracking tool to help parents reward reading. You control the prizes and values!
          </Text>
        </View>

        {steps.map((step, index) => (
          <View key={step.number} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumberBadge, { backgroundColor: step.bgColor }]}>
                <Text style={[styles.stepNumber, { color: step.color }]}>
                  {step.number}
                </Text>
              </View>
              <View style={styles.stepTitleContainer}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  <Text style={[styles.stepTitle, { color: step.color }]}>
                    {step.title}
                  </Text>
                </View>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
              </View>
            </View>

            <View style={styles.stepContent}>
              {step.description.map((line, i) => (
                <View key={i} style={styles.descriptionRow}>
                  <CheckCircle2 size={16} color={step.color} />
                  <Text style={styles.descriptionText}>{line}</Text>
                </View>
              ))}
            </View>

            {index < steps.length - 1 && <View style={styles.stepConnector} />}
          </View>
        ))}

        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
            <Text style={styles.ctaText}>
              Set up your first child and start rewarding reading today!
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/children')}
            >
              <Users size={20} color="#FFF" />
              <Text style={styles.ctaButtonText}>Add Your First Child</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <BookOpen size={40} color="#CCC" />
          <Text style={styles.footerText}>
            BookBucks is a tracking tool that helps you reward reading your way. You're always in control!
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
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 40,
    paddingBottom: 24,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  stepCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumberBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  stepTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  stepContent: {
    paddingLeft: 8,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginLeft: 12,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 23,
    marginTop: 8,
  },
  ctaSection: {
    padding: 16,
    paddingTop: 8,
  },
  ctaCard: {
    backgroundColor: '#2E7D32',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 14,
    color: '#E8F5E9',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA726',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 16,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
