export type AIIntakeReply = {
  mode: 'ask' | 'guide';
  message: string;
  question?: string;
  steps?: string[];
};

import { supabase } from './supabase';
import { AIMessage, getAllUserMemories, getConversationContext } from './ai';

const SYSTEM_PROMPT = `You are a concise intake assistant.
Behavior:
- Keep replies short (1–2 sentences). Use plain language. No emojis.
- First, reflect understanding in ≤1 short sentence.
- If information is insufficient, ask exactly one focused question.
- If sufficient, give next steps in ≤3 short bullets.
- Prefer specifics: what happened, when, where, who, evidence, urgency.
- If emergency or danger: tell the user to contact local emergency services immediately.
- Ask for jurisdiction (city/country) only if relevant to guidance.
- No legal conclusions; provide procedural guidance only.
Output JSON only with: { "mode": "ask" | "guide", "message": string, "question"?: string, "steps"?: string[] }`;

function safeParseIntake(text: string): AIIntakeReply | null {
  try {
    const parsed = JSON.parse(text) as AIIntakeReply;
    if (!parsed || !parsed.mode || !parsed.message) return null;
    if (parsed.mode === 'guide' && parsed.steps && !Array.isArray(parsed.steps)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isEmergencyLike(text: string): boolean {
  const t = text.toLowerCase();
  const keywords = ['danger', 'violence', 'threat', 'stalking', 'attack', 'bleeding', 'suicide', 'harassment', 'kidnap', 'assault', 'rape'];
  return keywords.some(k => t.includes(k));
}

export async function generateIntakeReply(conversation_id: string, userText: string): Promise<{ raw: string; parsed: AIIntakeReply; saved: AIMessage }> {
  // Build short context
  const history = await getConversationContext(conversation_id, 6);

  // Optional: include memory signal to help with locality
  const memories = await getAllUserMemories();
  const memoryBlurb = memories.length ? `User hints: ${memories.slice(0,5).map(m => `${m.key}=${typeof m.value === 'object' ? JSON.stringify(m.value) : String(m.value)}`).join(', ')}` : '';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    memoryBlurb ? { role: 'system', content: memoryBlurb } as const : undefined,
    { role: 'user', content: userText }
  ].filter(Boolean) as { role: 'system' | 'user' | 'assistant'; content: string }[];

  const { data, error } = await supabase.functions.invoke('llm-proxy', {
    body: {
      messages,
      temperature: 0.2,
      max_tokens: 220,
    },
  });
  if (error) throw error;

  const raw: string = data?.choices?.[0]?.message?.content ?? data?.result ?? String(data);

  // Parse with fallback contract repair
  let parsed = safeParseIntake(raw);
  if (!parsed) {
    parsed = {
      mode: 'ask',
      message: "Sorry, I didn't catch that.",
      question: 'Could you briefly share what happened, when, and where?'
    };
  }

  // Emergency prefix if needed
  if (isEmergencyLike(userText)) {
    const prefix = 'If you are in immediate danger, contact local emergency services now.';
    parsed = parsed.mode === 'guide'
      ? { ...parsed, message: `${prefix} ${parsed.message}` }
      : { ...parsed, message: `${prefix} ${parsed.message}` };
  }

  // Save assistant message (store raw for traceability)
  const { data: msg, error: insErr } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id,
      role: 'assistant',
      content: raw,
      message_type: 'json',
      metadata: { response_type: 'intake', parsed_ok: Boolean(parsed) }
    })
    .select('*')
    .single();
  if (insErr) throw insErr;

  return { raw, parsed, saved: msg as AIMessage };
}
