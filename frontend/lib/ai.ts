import { supabase } from './supabase';

export type AIConversation = {
  id: string;
  user_id: string | null;
  title: string | null;
  context_type: string | null;
  context_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AIMessage = {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  message_type: string;
  metadata: any;
  created_at: string;
};

export type UserMemory = {
  id: string;
  user_id: string;
  key: string;
  value: any;
  memory_type: 'preference' | 'fact' | 'context';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getOrCreateConversation(title = 'New Chat') {
  // Try to find the most recent conversation
  const { data: existing, error: findErr } = await supabase
    .from('ai_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (findErr) throw findErr;
  if (existing && existing.length > 0) return existing[0] as AIConversation;

  // Create one
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ title })
    .select('*')
    .single();
  if (error) throw error;
  return data as AIConversation;
}

export async function listMessages(conversation_id: string) {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as AIMessage[];
}

export async function sendMessage(conversation_id: string, content: string) {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({ conversation_id, role: 'user', content })
    .select('*')
    .single();
  if (error) throw error;
  return data as AIMessage;
}

// User memory management functions
export async function getUserMemory(key: string) {
  const { data, error } = await supabase
    .from('ai_memory')
    .select('*')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data as UserMemory | null;
}

export async function setUserMemory(key: string, value: any, type: 'preference' | 'fact' | 'context' = 'fact', expiresAt?: Date) {
  const { data, error } = await supabase
    .from('ai_memory')
    .upsert({
      key,
      value,
      memory_type: type,
      expires_at: expiresAt?.toISOString() || null,
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as UserMemory;
}

export async function getAllUserMemories() {
  const { data, error } = await supabase
    .from('ai_memory')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UserMemory[];
}

// Get conversation context for better AI responses
export async function getConversationContext(conversation_id: string, limit = 10) {
  const messages = await listMessages(conversation_id);
  const recentMessages = messages.slice(-limit);
  
  // Format messages for AI context
  return recentMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

// Create system prompt based on user memory and context
export async function createSystemPrompt() {
  const memories = await getAllUserMemories();
  
  let systemPrompt = `You are an expert legal advisor and government services assistant for Indian citizens. You specialize in:

- Government policies, schemes, and regulations
- Legal procedures and documentation
- Citizen rights and obligations
- Application processes for government services

Your personality:
- Act like an experienced lawyer who genuinely cares about helping citizens
- Ask clarifying questions when the user's request is vague
- Be conversational and human-like, not robotic
- Remember past conversations and build on them
- Provide specific, actionable advice
- If you don't have enough information, ask follow-up questions instead of making assumptions

Conversation style:
- Start with understanding the user's specific situation
- Ask relevant follow-up questions to get clarity
- Provide personalized advice based on their context
- Be concise but thorough
- Use simple language, avoid legal jargon unless necessary`;

  // Add user-specific context from memory
  if (memories.length > 0) {
    systemPrompt += `\n\nWhat you know about this user from previous conversations:`;
    
    const preferences = memories.filter(m => m.memory_type === 'preference');
    const facts = memories.filter(m => m.memory_type === 'fact');
    const context = memories.filter(m => m.memory_type === 'context');
    
    if (preferences.length > 0) {
      systemPrompt += `\nPreferences: ${preferences.map(p => `${p.key}: ${JSON.stringify(p.value)}`).join(', ')}`;
    }
    
    if (facts.length > 0) {
      systemPrompt += `\nUser Facts: ${facts.map(f => `${f.key}: ${JSON.stringify(f.value)}`).join(', ')}`;
    }
    
    if (context.length > 0) {
      systemPrompt += `\nContext: ${context.map(c => `${c.key}: ${JSON.stringify(c.value)}`).join(', ')}`;
    }
  }

  return systemPrompt;
}

// Enhanced AI reply generation with conversation intelligence
export async function generateAIReply(conversation_id: string, prompt: string) {
  // Get conversation context
  const conversationHistory = await getConversationContext(conversation_id, 8);
  
  // Create personalized system prompt
  const systemPrompt = await createSystemPrompt();
  
  // Build messages array with context
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: prompt }
  ];

  // Call NVIDIA via edge function with full context
  const { data, error } = await supabase.functions.invoke('llm-proxy', {
    body: {
      messages,
      temperature: 0.7, // Slightly higher for more conversational responses
      max_tokens: 800, // More space for detailed responses
    },
  });
  if (error) throw error;
  
  const content: string = data?.choices?.[0]?.message?.content ?? data?.result ?? String(data);

  // Extract and store user information from the conversation
  await extractAndStoreUserInfo(prompt, content);

  // Save assistant message with metadata
  const { data: msg, error: insErr } = await supabase
    .from('ai_messages')
    .insert({ 
      conversation_id, 
      role: 'assistant', 
      content,
      message_type: 'text',
      metadata: { 
        response_type: 'conversational',
        context_used: conversationHistory.length,
        memory_count: (await getAllUserMemories()).length
      }
    })
    .select('*')
    .single();
  if (insErr) throw insErr;

  // Update conversation with intelligent title
  const title = await generateConversationTitle(conversation_id);
  await supabase
    .from('ai_conversations')
    .update({ 
      updated_at: new Date().toISOString(), 
      title,
      context_type: 'general'
    })
    .eq('id', conversation_id);

  return msg as AIMessage;
}

// Extract important information from user messages and store as memory
export async function extractAndStoreUserInfo(userMessage: string, aiResponse: string) {
  // Simple keyword-based extraction (can be enhanced with NLP)
  const message = userMessage.toLowerCase();
  
  // Extract location information
  const locationKeywords = ['from', 'live in', 'based in', 'located in'];
  locationKeywords.forEach(keyword => {
    if (message.includes(keyword)) {
      const words = message.split(' ');
      const keywordIndex = words.findIndex(w => message.includes(keyword));
      if (keywordIndex >= 0 && keywordIndex < words.length - 1) {
        const location = words.slice(keywordIndex + 1, keywordIndex + 3).join(' ');
        if (location.length > 2) {
          setUserMemory('location', location, 'fact').catch(console.error);
        }
      }
    }
  });
  
  // Extract age/status information
  if (message.includes('years old') || message.includes('age')) {
    const ageMatch = message.match(/(\d+)\s*(years?\s*old|age)/i);
    if (ageMatch) {
      setUserMemory('age', parseInt(ageMatch[1]), 'fact').catch(console.error);
    }
  }
  
  // Extract profession/occupation
  const professionKeywords = ['work as', 'job', 'profession', 'occupation', 'employed as'];
  professionKeywords.forEach(keyword => {
    if (message.includes(keyword)) {
      const words = message.split(' ');
      const keywordIndex = words.findIndex(w => message.includes(keyword));
      if (keywordIndex >= 0 && keywordIndex < words.length - 1) {
        const profession = words.slice(keywordIndex + 1, keywordIndex + 3).join(' ');
        if (profession.length > 2) {
          setUserMemory('profession', profession, 'fact').catch(console.error);
        }
      }
    }
  });
  
  // Extract interests/topics they're asking about
  const topics = ['passport', 'visa', 'pan card', 'aadhaar', 'gst', 'income tax', 'property', 'marriage', 'divorce', 'education', 'scholarship'];
  topics.forEach(topic => {
    if (message.includes(topic)) {
      setUserMemory(`interested_in_${topic}`, true, 'context', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).catch(console.error);
    }
  });
}

// Generate intelligent conversation titles based on content
export async function generateConversationTitle(conversation_id: string): Promise<string> {
  const messages = await listMessages(conversation_id);
  if (messages.length === 0) return 'New Conversation';
  
  const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
  
  // Simple title generation based on keywords
  if (firstUserMessage.toLowerCase().includes('passport')) return 'Passport Application Help';
  if (firstUserMessage.toLowerCase().includes('pan card')) return 'PAN Card Assistance';
  if (firstUserMessage.toLowerCase().includes('aadhaar')) return 'Aadhaar Card Support';
  if (firstUserMessage.toLowerCase().includes('gst')) return 'GST Registration Help';
  if (firstUserMessage.toLowerCase().includes('property')) return 'Property Related Query';
  if (firstUserMessage.toLowerCase().includes('tax')) return 'Tax Related Help';
  if (firstUserMessage.toLowerCase().includes('marriage')) return 'Marriage Documentation';
  if (firstUserMessage.toLowerCase().includes('education')) return 'Education Related Query';
  
  // Default to first few words of the user's message
  const words = firstUserMessage.split(' ').slice(0, 4);
  return words.join(' ').substring(0, 30) + (firstUserMessage.length > 30 ? '...' : '');
}
