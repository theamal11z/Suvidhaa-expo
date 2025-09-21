// Supabase Edge Function: llm-proxy
// Proxies requests from the client to NVIDIA's LLM API using a server-side API key.
// Secrets required (set in Supabase): NVIDIA_API_KEY
// Optional: Model can be sent by the client or defaulted here.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const DEFAULT_MODEL = Deno.env.get("NVIDIA_MODEL") || "meta/llama-4-scout-17b-16e-instruct";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("NVIDIA_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing NVIDIA_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, prompt, model, temperature = 0.2, max_tokens = 1024 } = body ?? {};

    // Allow either OpenAI-style messages or a simple prompt
    const requestBody = messages
      ? { model: model || DEFAULT_MODEL, messages, temperature, max_tokens }
      : {
          model: model || DEFAULT_MODEL,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: String(prompt ?? "") },
          ],
          temperature,
          max_tokens,
        };

    // NVIDIA's Integrate API is compatible with OpenAI's /chat/completions
    const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data?.error ?? data }), {
        status: resp.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
