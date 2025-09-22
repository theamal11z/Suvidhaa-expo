import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UnderstandResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams() as { title?: string; summary?: string; error?: string };

  const title = params.title || 'Result';
  const summary = (params.summary || '').trim();
  const error = params.error;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Ionicons name={error ? 'alert-circle' : 'bulb'} size={24} color={error ? '#b91c1c' : '#f59e0b'} />
            <Text style={styles.summaryTitle}>{error ? 'Analysis failed' : 'Policy Summary'}</Text>
          </View>

          <View style={styles.summaryContent}>
            {error ? (
              <Text style={[styles.summaryText, { color: '#b91c1c' }]}>{error}</Text>
            ) : summary ? (
              <Text style={styles.summaryText}>{summary}</Text>
            ) : (
              <Text style={styles.summaryText}>No summary available.</Text>
            )}
          </View>

          <View style={styles.summaryActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={async () => {
                if (!summary) return;
                try {
                  await Share.share({ message: `Policy Summary\n\n${summary}` });
                } catch {}
              }}
              disabled={!summary}
            >
              <Ionicons name="share-outline" size={20} color="#2563eb" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/ask-ai' as any)}>
              <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
              <Text style={styles.actionButtonText}>Ask Questions</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: { width: 40 },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summarySection: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  summaryContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    maxHeight: 400,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  summaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginLeft: 4,
  },
});
