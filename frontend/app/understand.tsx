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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { insertSummary } from '../lib/db';

export default function UnderstandScreen() {
  const router = useRouter();
  const [documentUrl, setDocumentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState('');
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastDocumentId, setLastDocumentId] = useState<string | null>(null);
  // Local file selection (no Cloudinary upload)
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [localFileMime, setLocalFileMime] = useState<string | null>(null);

  // Try to fetch readable text from a URL (HTML/text only)
  const fetchUrlPreview = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) return null;
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/pdf')) return null; // skip PDFs (client can't parse)
      if (ct.startsWith('text/') || ct.includes('html')) {
        const raw = await res.text();
        const isHtml = ct.includes('html') || /<html[^>]*>/i.test(raw);
        let text = raw;
        if (isHtml) {
          text = raw
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ');
        }
        text = text.replace(/\s+/g, ' ').trim();
        const max = 6000; // keep prompt manageable
        if (text.length > max) text = text.slice(0, max) + '...';
        return text;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const handlePickAndUpload = async () => {
    try {
      setUploading(true);
      setLocalFileUri(null);
      setLocalFileName(null);
      setLocalFileMime(null);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', '*/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) {
        setUploading(false);
        return;
      }
      const asset = res.assets[0];
      setLocalFileUri(asset.uri);
      setLocalFileName(asset.name || 'document');
      setLocalFileMime(asset.mimeType ?? null);
      Alert.alert('File selected', asset.name || 'document');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Selection failed', e?.message ?? 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentAnalysis = async () => {
    let url = documentUrl.trim();
    if (!url) {
      Alert.alert('Error', 'Please enter a document URL or upload a document');
      return;
    }
    // Accept URLs without scheme by defaulting to https
    if (!/^https?:\/\//i.test(url)) {
      const tentative = `https://${url}`;
      try {
        // Validate
        new URL(tentative);
        url = tentative;
      } catch {
        Alert.alert('Invalid URL', 'Please enter a valid http(s) URL');
        return;
      }
    }

    try {
      setIsAnalyzing(true);
      setSummary('');
      setAnalyzeError(null);

      // Extract text: prefer server-side edge function for PDFs/images/HTML
      let extractedText: string | null = null;
      try {
        if (localFileUri) {
          // Read local file as base64 and send to extractor
          const base64 = await FileSystem.readAsStringAsync(localFileUri, { encoding: FileSystem.EncodingType.Base64 });
          const { data: exData, error: exErr } = await supabase.functions.invoke('extract-text', {
            body: {
              file: {
                name: localFileName || 'document',
                mime: localFileMime || 'application/octet-stream',
                base64,
              },
            },
          });
          if (exErr) throw exErr;
          extractedText = exData?.text || null;
        } else if (url) {
          const { data: exData, error: exErr } = await supabase.functions.invoke('extract-text', { body: { url } });
          if (!exErr && exData?.text) {
            extractedText = exData.text as string;
          } else {
            // Fallback: client-side fetch for HTML/text only
            extractedText = await fetchUrlPreview(url);
          }
        }
      } catch (ex) {
        console.warn('extract-text failed, falling back to client fetch (HTML only).', ex);
        if (url) extractedText = await fetchUrlPreview(url);
      }

      // If nothing extracted, set error and bail to result screen
      if (!extractedText || extractedText.trim().length === 0) {
        setAnalyzeError('Could not extract text from this source. For PDFs or images, ensure the edge function "extract-text" is deployed.');
        // Navigate to result screen with error state
        router.push({
          pathname: '/understand-result',
          params: {
            title: localFileName || url,
            error: 'Extraction failed',
          },
        } as any);
        return;
      }

      // Build messages using extracted text
      const messages = [
        { role: 'system', content: 'You are a concise policy summarizer for citizens. Summarize the provided document text and list key points.' },
        { role: 'user', content: extractedText.slice(0, 12000) },
      ];

      const { data, error } = await supabase.functions.invoke('llm-proxy', {
        body: {
          messages,
          temperature: 0.2,
          max_tokens: 700,
        },
      });
      if (error) throw error;

      const pickContent = (resp: any): string => {
        const c1 = resp?.choices?.[0]?.message?.content;
        const c2 = resp?.result;
        const c3 = typeof resp === 'string' ? resp : JSON.stringify(resp ?? {});
        const out = String(c1 ?? c2 ?? c3);
        return out;
      };
      const content = pickContent(data);
      const text = String(content || '').trim();

      // Navigate to dedicated result screen
      router.push({
        pathname: '/understand-result',
        params: {
          title: localFileName || url,
          summary: text || '',
        },
      } as any);
    } catch (e: any) {
      console.error(e);
      setAnalyzeError(e?.message ?? 'Analysis failed. Please try again later.');
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
      <View style={[styles.header, { paddingTop: 12 }]}>
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
            {(localFileName || localFileUri) ? (
              <Text style={{ textAlign: 'center', color: '#374151', marginBottom: 8 }}>
                {localFileName ? `Selected: ${localFileName}` : null}
                {localFileUri ? `\nLocal file ready` : null}
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

        {/* Summary Display (moved up so results are visible without scrolling) */}
        {/* Results moved to separate screen; keep a lightweight status only */}
        {isAnalyzing ? (
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Ionicons name="bulb" size={24} color="#f59e0b" />
              <Text style={styles.summaryTitle}>Analyzing…</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryText}>Working on your document. You will be redirected to results.</Text>
            </View>
          </View>
        ) : analyzeError ? (
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Ionicons name="alert-circle" size={24} color="#b91c1c" />
              <Text style={styles.summaryTitle}>Analysis failed</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryText, { color: '#b91c1c' }]}>{analyzeError}</Text>
            </View>
          </View>
        ) : null}
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Ionicons name="bulb" size={24} color="#f59e0b" />
              <Text style={styles.summaryTitle}>Policy Summary</Text>
            </View>
            
            <View style={styles.summaryContent}>
              <ScrollView style={styles.summaryScroll}>
                {isAnalyzing ? (
                  <Text style={styles.summaryText}>Analyzing the document…</Text>
                ) : analyzeError ? (
                  <Text style={[styles.summaryText, { color: '#b91c1c' }]}>{analyzeError}</Text>
                ) : summary ? (
                  <Text style={styles.summaryText}>{summary}</Text>
                ) : (
                  <Text style={styles.summaryText}>No summary available.</Text>
                )}
              </ScrollView>
            </View>
            
            <View style={styles.summaryActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    if (!summary) return;
                    await insertSummary({ document_id: lastDocumentId ?? null, summary_text: summary });
                    Alert.alert('Saved', 'Summary saved successfully.');
                  } catch (e: any) {
                    console.warn('Manual save failed:', e);
                    Alert.alert('Save failed', e?.message ?? 'Please try again.');
                  }
                }}
                disabled={!summary}
              >
                <Ionicons name="bookmark-outline" size={20} color="#2563eb" />
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  if (!summary) return;
                  try {
                    await Share.share({ message: `Policy Summary\n\n${summary}` });
                  } catch (e) {
                    // Ignore
                  }
                }}
                disabled={!summary}
              >
                <Ionicons name="share-outline" size={20} color="#2563eb" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/ask-ai' as any)}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
                <Text style={styles.actionButtonText}>Ask Questions</Text>
              </TouchableOpacity>
            </View>
          </View>

        {/* Quick Topics */}
        <View style={styles.quickTopicsSection}>
          <Text style={styles.sectionTitle}>Quick Topics</Text>
          <Text style={styles.sectionSubtitle}>
            Explore summaries of popular government policies
          </Text>
          
          <View style={styles.topicsGrid}>
            {quickTopics.map((topic, index) => (
              <TouchableOpacity key={index} style={styles.topicCard} onPress={() => router.push('/ask-ai' as any)}>
                <Text style={styles.topicText}>{topic}</Text>
                <Ionicons name="arrow-forward" size={16} color="#2563eb" />
              </TouchableOpacity>
            ))}
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