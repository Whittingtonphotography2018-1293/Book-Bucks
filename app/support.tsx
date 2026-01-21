import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, MessageCircle, BookOpen, HelpCircle, AlertCircle } from 'lucide-react-native';

interface FAQItem {
  question: string;
  answer: string;
}

export default function SupportScreen() {
  const router = useRouter();

  const faqs: FAQItem[] = [
    {
      question: 'How do I add my first child?',
      answer: 'Go to the Children tab, tap the "Add Child" button, and fill in their name and grade level. You can also set up their reward preferences right away.',
    },
    {
      question: 'How do rewards work?',
      answer: 'You decide everything! Choose between money rewards (any amount per book) or a points system. Set how many books they need to read to earn their reward. You control when and how to give the actual prizes.',
    },
    {
      question: 'What happens when I approve a book?',
      answer: 'When you approve a book, it counts toward your child\'s reading goal and adds to their earned rewards. The app tracks progress, but you decide when to actually give the reward.',
    },
    {
      question: 'Can I change reward settings later?',
      answer: 'Yes! Go to the Children tab, tap on your child\'s card, and you can update their reward settings at any time.',
    },
    {
      question: 'What grade levels are supported?',
      answer: 'Reading Riches supports kindergarten (K) through grade 12. This helps you track age-appropriate reading progress.',
    },
    {
      question: 'How do I review books my child has logged?',
      answer: 'Go to Settings and tap "Review Books" to see all pending books waiting for your approval. You can also access this from the notification badge on the Settings tab.',
    },
    {
      question: 'Can I have multiple children?',
      answer: 'Yes! You can add as many children as you need. Each child has their own reading progress and reward settings.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! All your data is securely stored and only accessible by your account. We use industry-standard security practices to protect your information.',
    },
  ];

  const handleEmailSupport = () => {
    const email = 'support@readingriches.app';
    const subject = 'Reading Riches Support Request';
    const body = 'Please describe your issue or question:';

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailtoUrl).catch((err) => {
      console.error('Error opening email:', err);
      if (Platform.OS === 'web') {
        window.alert(`Please email us at: ${email}`);
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <HelpCircle size={48} color="#2E7D32" />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions or get in touch with our support team.
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Support</Text>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
            <View style={styles.contactIcon}>
              <Mail size={24} color="#2E7D32" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSubtitle}>support@readingriches.app</Text>
              <Text style={styles.contactDescription}>
                We typically respond within 24 hours
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <MessageCircle size={20} color="#2E7D32" />
                <Text style={styles.faqQuestion}>{faq.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.additionalHelp}>
          <AlertCircle size={20} color="#666" />
          <Text style={styles.additionalHelpText}>
            Need more help? Visit the "How It Works" section to learn about all the features of Reading Riches.
          </Text>
        </View>

        <View style={styles.footer}>
          <BookOpen size={32} color="#CCC" />
          <Text style={styles.footerText}>Reading Riches v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Making reading rewarding for families
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
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
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
  contactSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 13,
    color: '#666',
  },
  faqSection: {
    padding: 16,
    paddingTop: 24,
  },
  faqCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    paddingLeft: 32,
  },
  additionalHelp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  additionalHelpText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 16,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    marginTop: 12,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
});
