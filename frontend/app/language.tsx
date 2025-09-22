import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      const { data: row } = await supabase
        .from('ai_memory')
        .select('value')
        .eq('user_id', user.id)
        .eq('key', 'app_language')
        .maybeSingle();
      const v = (row as any)?.value;
      if (v) setSelected(typeof v === 'string' ? v : (v.code || 'en'));
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      const lang = LANGUAGES.find(l => l.code === selected) || LANGUAGES[0];
      await supabase
        .from('ai_memory')
        .upsert({ user_id: user.id, key: 'app_language', value: { code: lang.code, label: lang.label }, memory_type: 'preference' });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
        <TouchableOpacity onPress={handleSave} style={styles.iconButton} disabled={saving}>
          <Ionicons name="checkmark" size={24} color={saving ? '#9ca3af' : '#2563eb'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {LANGUAGES.map((lang) => {
          const active = selected === lang.code;
          return (
            <TouchableOpacity key={lang.code} style={styles.row} onPress={() => setSelected(lang.code)}>
              <Text style={styles.rowText}>{lang.label}</Text>
              <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? '#2563eb' : '#9ca3af'} />
            </TouchableOpacity>
          );
        })}
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowText: { fontSize: 16, color: '#111827' },
});