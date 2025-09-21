import React, { useState } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import { uploadToCloudinary } from '../lib/cloudinary';
import { supabase } from '../lib/supabase';
import { insertDocument, insertSummary } from '../lib/db';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UnderstandScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [documentUrl, setDocumentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  const handlePickAndUpload = async () => {
    try {
      setUploading(true);
      setUploadedUrl(null);
      setPickedName(null);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', '*/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) {
        setUploading(false);
        return;
      }
      const asset = res.assets[0];
      setPickedName(asset.name || 'document');

      const uploadRes = await uploadToCloudinary({
        uri: asset.uri,
        name: asset.name ?? 'upload',
        type: asset.mimeType ?? 'application/octet-stream',
      });
      setUploadedUrl(uploadRes.secure_url);
      Alert.alert('Upload complete', 'File uploaded to Cloudinary successfully.');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Upload failed', e?.message ?? 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentAnalysis = async () => {
    const url = documentUrl.trim() || uploadedUrl;
    if (!url) {
      Alert.alert('Error', 'Please enter a document URL or upload a document');
      return;
    }

    try {
      setIsAnalyzing(true);
      setSummary('');
      let documentId: string | null = null;
      // Try to save the document reference first (best-effort)
      try {
        const doc = await insertDocument({ url, type: 'pdf', cloudinary_public_id: null });
        documentId = doc.id;
      } catch (e) {
        // Non-fatal if schema isn't ready yet
        console.warn('insertDocument skipped or failed:', e);
      }
      // Call the NVIDIA proxy function via Supabase Edge Functions
      const { data, error } = await supabase.functions.invoke('llm-proxy', {
        body: {
          prompt: `Summarize this document succinctly for a citizen audience and list key points. Document: ${url}`,
          temperature: 0.2,
          max_tokens: 700,
        },
      });
      if (error) throw error;

      // NVIDIA chat completion style response
      const content = data?.choices?.[0]?.message?.content ?? data?.result ?? JSON.stringify(data);
      setSummary(String(content));

      // Try to persist summary (best-effort)
      try {
        await insertSummary({ document_id: documentId, summary_text: String(content) });
      } catch (e) {
        console.warn('insertSummary skipped or failed:', e);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Analysis failed', e?.message ?? 'Unknown error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const quickTopics = [
    'Healthcare Policies',
    'Education Reform',
    'Digital Infrastructure', 
    'Environmental Laws',
    'Tax Policies',
    'Housing Schemes',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Understand</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons name="document-text" size={48} color="#2563eb" />
          <Text style={styles.heroTitle}>Simplify Complex Policies</Text>
          <Text style={styles.heroSubtitle}>
            Upload or link government documents and get easy-to-understand summaries with visual explanations.
          </Text>
        </View>

        {/* Document Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Add Document</Text>
          
          <View style={styles.uploadOptions}>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickAndUpload} disabled={uploading}>
              <Ionicons name="cloud-upload" size={24} color="#2563eb" />
              <Text style={styles.uploadText}>{uploading ? 'Uploading…' : 'Upload PDF'}</Text>
            </TouchableOpacity>
            {pickedName || uploadedUrl ? (
              <Text style={{ textAlign: 'center', color: '#374151', marginBottom: 8 }}>
                {pickedName ? `Selected: ${pickedName}` : null}
                {uploadedUrl ? `\nUploaded to: ${uploadedUrl}` : null}
              </Text>
            ) : null}
            
            <Text style={styles.orText}>or</Text>
            
            <View style={styles.urlInputContainer}>
              <TextInput
                style={styles.urlInput}
                placeholder="Paste document URL here..."
                value={documentUrl}
                onChangeText={setDocumentUrl}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
            onPress={handleDocumentAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="sync" size={20} color="#ffffff" />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="search" size={20} color="#ffffff" />
                <Text style={styles.analyzeButtonText}>Analyze Document</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Topics */}
        <View style={styles.quickTopicsSection}>
          <Text style={styles.sectionTitle}>Quick Topics</Text>
          <Text style={styles.sectionSubtitle}>
            Explore summaries of popular government policies
          </Text>
          
          <View style={styles.topicsGrid}>
            {quickTopics.map((topic, index) => (
              <TouchableOpacity key={index} style={styles.topicCard}>
                <Text style={styles.topicText}>{topic}</Text>
                <Ionicons name="arrow-forward" size={16} color="#2563eb" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Display */}
        {summary ? (
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Ionicons name="bulb" size={24} color="#f59e0b" />
              <Text style={styles.summaryTitle}>Policy Summary</Text>
            </View>
            
            <View style={styles.summaryContent}>
              <ScrollView style={styles.summaryScroll}>
                <Text style={styles.summaryText}>{summary}</Text>
              </ScrollView>
            </View>
            
            <View style={styles.summaryActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="bookmark-outline" size={20} color="#2563eb" />
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color="#2563eb" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
                <Text style={styles.actionButtonText}>Ask Questions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  uploadOptions: {
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    paddingVertical: 40,
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
    marginLeft: 8,
  },
  orText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
  },
  urlInputContainer: {
    marginBottom: 20,
  },
  urlInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickTopicsSection: {
    marginBottom: 40,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  topicCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  topicText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
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
    maxHeight: 300,
  },
  summaryScroll: {
    flex: 1,
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