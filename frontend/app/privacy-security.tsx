import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const handleChangePassword = async () => {
    if (!newPassword.trim() || newPassword !== confirmPassword) {
      Alert.alert('Validation', 'Passwords must match and not be empty');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) throw error;
      Alert.alert('Success', 'Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      Alert.alert('Update failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Account Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <View style={styles.row}> 
            <Ionicons name="mail" size={20} color="#6b7280" style={{ marginRight: 8 }} />
            <Text style={styles.rowText}>{email ?? '-'}</Text>
          </View>
        </View>

        {/* Privacy Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy Preferences</Text>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Private Account</Text>
              <Text style={styles.toggleSubtitle}>Hide activity from public views</Text>
            </View>
            <Switch value={privateAccount} onValueChange={setPrivateAccount} />
          </View>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Allow Analytics</Text>
              <Text style={styles.toggleSubtitle}>Help us improve by sharing anonymous usage</Text>
            </View>
            <Switch value={analyticsOptIn} onValueChange={setAnalyticsOptIn} />
          </View>
        </View>

        {/* Security */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={{ height: 10 }} />
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleChangePassword} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Updating...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          <Text style={styles.legalText}>By using Suvidhaa you agree to our Terms and Privacy Policy. Contact support for any data requests.</Text>
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
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginTop: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { color: '#374151' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  toggleTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },
  toggleSubtitle: { fontSize: 12, color: '#6b7280' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 44, color: '#111827' },
  primaryButton: { marginTop: 12, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  legalText: { fontSize: 12, color: '#6b7280' },
});