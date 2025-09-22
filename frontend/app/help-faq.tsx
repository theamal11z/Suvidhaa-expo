import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAQS = [
  { q: 'What is Suvidhaa?', a: 'Suvidhaa helps citizens understand policies, ask questions, and track issues.' },
  { q: 'How do I ask a question?', a: 'Go to the Home tab and tap Ask AI or Ask a Question to get started.' },
  { q: 'How do I track my tickets?', a: 'Open the Watchlist tab or Track Progress from the home shortcuts.' },
  { q: 'Is my data secure?', a: 'We use industry-standard security and you can control privacy in Privacy & Security.' },
];

export default function HelpFaqScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & FAQ</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {FAQS.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.q}>{item.q}</Text>
            <Text style={styles.a}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  iconButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  content: { paddingHorizontal: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginTop: 16 },
  q: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6 },
  a: { fontSize: 13, color: '#374151' },
});