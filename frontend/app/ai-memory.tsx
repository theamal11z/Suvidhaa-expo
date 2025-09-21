import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllUserMemories, UserMemory } from '../lib/ai';

export default function AIMemoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const data = await getAllUserMemories();
      setMemories(data);
    } catch (error) {
      console.error('Error loading memories:', error);
      Alert.alert('Error', 'Failed to load user memories');
    } finally {
      setLoading(false);
    }
  };

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case 'preference': return 'settings';
      case 'fact': return 'person';
      case 'context': return 'time';
      default: return 'information-circle';
    }
  };

  const getMemoryColor = (type: string) => {
    switch (type) {
      case 'preference': return '#2563eb';
      case 'fact': return '#16a34a';
      case 'context': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading AI memory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>AI Memory</Text>
          <Text style={styles.subtitle}>What the AI has learned about you</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadMemories}>
          <Ionicons name="refresh" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {memories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="brain" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No memories yet</Text>
            <Text style={styles.emptyMessage}>
              Start chatting with the AI assistant to build your knowledge base
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {memories.length} memories stored
            </Text>
            
            {memories.map((memory) => (
              <View key={memory.id} style={styles.memoryCard}>
                <View style={styles.memoryHeader}>
                  <View style={styles.memoryTypeContainer}>
                    <Ionicons 
                      name={getMemoryIcon(memory.memory_type) as any} 
                      size={20} 
                      color={getMemoryColor(memory.memory_type)} 
                    />
                    <Text style={[styles.memoryType, { color: getMemoryColor(memory.memory_type) }]}>
                      {memory.memory_type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memoryDate}>
                    {formatDate(memory.created_at)}
                  </Text>
                </View>
                
                <Text style={styles.memoryKey}>{memory.key}</Text>
                <Text style={styles.memoryValue}>{formatValue(memory.value)}</Text>
                
                {memory.expires_at && (
                  <Text style={styles.expiryText}>
                    Expires: {formatDate(memory.expires_at)}
                  </Text>
                )}
              </View>
            ))}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginVertical: 20,
    textAlign: 'center',
  },
  memoryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryType: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  memoryDate: {
    fontSize: 10,
    color: '#9ca3af',
  },
  memoryKey: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memoryValue: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  expiryText: {
    fontSize: 10,
    color: '#f59e0b',
    marginTop: 8,
    fontStyle: 'italic',
  },
});