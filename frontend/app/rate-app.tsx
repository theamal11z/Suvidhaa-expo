import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.suvidhaa.app';
const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000';

export default function RateAppScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRate = async () => {
    const url = PLAY_STORE_URL; // Could detect platform; using Play Store placeholder
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Unavailable', 'Could not open the store link.');
    } catch (e) {
      Alert.alert('Error', 'Failed to open store');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Rate App</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.card}>
          <Ionicons name="star" size={32} color="#f59e0b" />
          <Text style={styles.cardTitle}>Enjoying Suvidhaa?</Text>
          <Text style={styles.cardText}>Your review helps us reach more citizens and improve the app.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRate}>
            <Text style={styles.primaryButtonText}>Rate Now</Text>
          </TouchableOpacity>
        </View>
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
  card: { marginTop: 24, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, alignItems: 'center', padding: 24 },
  cardTitle: { marginTop: 8, fontSize: 16, fontWeight: '600', color: '#111827' },
  cardText: { marginTop: 6, fontSize: 13, color: '#6b7280', textAlign: 'center' },
  primaryButton: { marginTop: 16, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
});