import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleAdd = () => {
    Alert.alert('Coming soon', 'Payment methods will be available in a future update.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.iconButton}>
          <Ionicons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.card}>
          <Ionicons name="card-outline" size={28} color="#6b7280" />
          <Text style={styles.cardTitle}>No payment methods yet</Text>
          <Text style={styles.cardText}>Add a card or UPI method to pay for premium features when available.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAdd}>
            <Text style={styles.primaryButtonText}>Add Payment Method</Text>
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