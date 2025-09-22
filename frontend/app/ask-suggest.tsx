import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submitQuestion, submitSuggestion, listMyQuestions } from '../lib/qa';

export default function AskSuggestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('ask');
  const [questionText, setQuestionText] = useState('');
  // Category key stored in DB (must match browse keys)
  const [questionCategory, setQuestionCategory] = useState<string>('');
  const [suggestionText, setSuggestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState<Array<{ id: string; text: string; status: string; created_at: string }>>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadRecentQuestions = async () => {
    try {
      setLoadingRecent(true);
      const rows = await listMyQuestions(10);
      setRecentQuestions(rows);
    } catch (e) {
      console.error('Failed to load recent questions', e);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) {
      Alert.alert('Error', 'Please enter your question');
      return;
    }
    try {
      setSubmitting(true);
      const row = await submitQuestion(questionText, null, questionCategory);
      Alert.alert('Success', 'Your question has been submitted!', [
        { text: 'OK' }
      ]);
      setQuestionText('');
      // Reload recent questions
      await loadRecentQuestions();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Submission failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
      Alert.alert('Error', 'Please enter your suggestion');
      return;
    }
    try {
      setSubmitting(true);
      const row = await submitSuggestion(suggestionText);
      Alert.alert('Success', 'Thank you for your suggestion!');
      setSuggestionText('');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Submission failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadRecentQuestions();
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, []);

  // Single source of truth for categories (keys are stored in DB)
  const categories = [
    { key: 'healthcare', label: 'Healthcare', icon: 'medical', color: '#ef4444' },
    { key: 'education', label: 'Education', icon: 'school', color: '#3b82f6' },
    { key: 'business', label: 'Business', icon: 'business', color: '#10b981' },
    { key: 'housing', label: 'Housing', icon: 'home', color: '#f59e0b' },
    { key: 'transport', label: 'Transport', icon: 'car', color: '#8b5cf6' },
    { key: 'environment', label: 'Environment', icon: 'leaf', color: '#22c55e' },
  ];

  // Ensure a default selection
  useEffect(() => {
    if (!questionCategory && categories.length > 0) {
      setQuestionCategory(categories[0].key);
    }
  }, [questionCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Ask & Suggest</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ask' && styles.activeTab]}
          onPress={() => setActiveTab('ask')}
        >
          <Ionicons 
            name="help-circle" 
            size={20} 
            color={activeTab === 'ask' ? '#2563eb' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'ask' && styles.activeTabText]}>
            Ask Question
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggest' && styles.activeTab]}
          onPress={() => setActiveTab('suggest')}
        >
          <Ionicons 
            name="bulb" 
            size={20} 
            color={activeTab === 'suggest' ? '#2563eb' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'suggest' && styles.activeTabText]}>
            Give Feedback
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'ask' ? (
          <>
            {/* Ask Question Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>What's your question?</Text>
              <Text style={styles.sectionSubtitle}>
                Ask anything about government services, policies, or procedures
              </Text>

            {/* Category selector (same categories as Browse) */}
              <View style={styles.categorySelector}>
                {categories.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setQuestionCategory(opt.key)}
                    style={[styles.catPill, questionCategory === opt.key && styles.catPillActive]}
                  >
                    <Text style={[styles.catPillText, questionCategory === opt.key && styles.catPillTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.textArea}
                placeholder="Type your question here..."
                value={questionText}
                onChangeText={setQuestionText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
              
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitQuestion} disabled={submitting}>
                <Ionicons name="send" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>{submitting ? 'Submitting…' : 'Submit Question'}</Text>
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Browse by Category</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.categoryCard}
                    onPress={() => router.push(`/questions/category/${encodeURIComponent(category.key)}` as any)}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon as any} size={24} color="#ffffff" />
                    </View>
                    <Text style={styles.categoryText}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Questions */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Your Recent Questions</Text>
              {loadingRecent ? (
                <Text style={styles.dateText}>Loading…</Text>
              ) : recentQuestions.length === 0 ? (
                <Text style={styles.dateText}>No questions yet</Text>
              ) : (
                recentQuestions.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.questionCard} onPress={() => router.push(`/question/${item.id}` as any)}>
                    <View style={styles.questionHeader}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: item.status === 'answered' ? '#dcfce7' : item.status === 'open' ? '#fef3c7' : '#e5e7eb' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: item.status === 'answered' ? '#16a34a' : item.status === 'open' ? '#d97706' : '#6b7280' }
                        ]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.questionText}>{item.text}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        ) : (
          <>
            {/* Feedback Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Share Your Feedback</Text>
              <Text style={styles.sectionSubtitle}>
                Help us improve government services with your suggestions
              </Text>
              
              <TextInput
                style={styles.textArea}
                placeholder="Share your feedback or suggestion..."
                value={suggestionText}
                onChangeText={setSuggestionText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
              
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitSuggestion} disabled={submitting}>
                <Ionicons name="send" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>{submitting ? 'Submitting…' : 'Submit Feedback'}</Text>
              </TouchableOpacity>
            </View>

            {/* Feedback Types */}
            <View style={styles.feedbackTypesSection}>
              <Text style={styles.sectionTitle}>Feedback Types</Text>
              
              <TouchableOpacity style={styles.feedbackTypeCard}>
                <View style={styles.feedbackTypeIcon}>
                  <Ionicons name="star" size={24} color="#f59e0b" />
                </View>
                <View style={styles.feedbackTypeContent}>
                  <Text style={styles.feedbackTypeTitle}>Service Improvement</Text>
                  <Text style={styles.feedbackTypeDescription}>
                    Suggest improvements to existing services
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#d1d5db" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.feedbackTypeCard}>
                <View style={styles.feedbackTypeIcon}>
                  <Ionicons name="warning" size={24} color="#ef4444" />
                </View>
                <View style={styles.feedbackTypeContent}>
                  <Text style={styles.feedbackTypeTitle}>Report Issue</Text>
                  <Text style={styles.feedbackTypeDescription}>
                    Report problems with government services
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#d1d5db" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.feedbackTypeCard}>
                <View style={styles.feedbackTypeIcon}>
                  <Ionicons name="add-circle" size={24} color="#10b981" />
                </View>
                <View style={styles.feedbackTypeContent}>
                  <Text style={styles.feedbackTypeTitle}>New Service Request</Text>
                  <Text style={styles.feedbackTypeDescription}>
                    Suggest new services that should be available
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#d1d5db" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 120,
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoriesSection: {
    marginBottom: 30,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 40,
  },
  questionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  questionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  categorySelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  catPill: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  catPillActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  catPillText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  catPillTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  feedbackTypesSection: {
    marginBottom: 40,
  },
  feedbackTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  feedbackTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedbackTypeContent: {
    flex: 1,
  },
  feedbackTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  feedbackTypeDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});