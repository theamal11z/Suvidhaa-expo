import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', location: '' });
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        setEmail(user?.email ?? null);
        const fullName = (user?.user_metadata as any)?.full_name || '';
        const phone = (user?.user_metadata as any)?.phone || '';
        // Fetch profile row if exists
        if (user) {
          const { data: profileRow } = await supabase
            .from('user_profiles')
            .select('full_name, phone, location')
            .eq('user_id', user.id)
            .maybeSingle();
          setForm({
            fullName: profileRow?.full_name ?? fullName,
            phone: profileRow?.phone ?? phone,
            location: profileRow?.location ?? '',
          });
        } else {
          setForm({ fullName, phone, location: '' });
        }
      } catch (e) {
        console.warn('Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Alert.alert('Validation', 'Full name is required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) throw new Error('Not authenticated');

      // Update auth metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: form.fullName.trim(), phone: form.phone.trim() },
      });
      if (authErr) throw authErr;

      // Upsert into user_profiles
      const { error: upsertErr } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: form.fullName.trim(),
          phone: form.phone.trim() || null,
          location: form.location.trim() || null,
        })
        .eq('user_id', user.id);
      if (upsertErr) throw upsertErr;

      Alert.alert('Success', 'Profile updated');
      router.back();
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
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.iconButton} disabled={loading}>
          <Ionicons name="checkmark" size={24} color={loading ? '#9ca3af' : '#2563eb'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputContainer, { backgroundColor: '#f3f4f6' }]}>
            <Ionicons name="mail" size={20} color="#9ca3af" style={styles.inputIcon} />
            <Text style={[styles.readonlyText]}>{email ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={form.fullName}
              onChangeText={(t) => setForm(v => ({ ...v, fullName: t }))}
              autoCapitalize="words"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone"
              value={form.phone}
              onChangeText={(t) => setForm(v => ({ ...v, phone: t }))}
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="City, Country"
              value={form.location}
              onChangeText={(t) => setForm(v => ({ ...v, location: t }))}
              placeholderTextColor="#9ca3af"
            />
          </View>
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
  section: { marginTop: 16 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 6, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 44, color: '#111827' },
  readonlyText: { flex: 1, height: 44, textAlignVertical: 'center', color: '#6b7280' },
});