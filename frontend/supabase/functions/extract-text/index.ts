// Supabase Edge Function: extract-text
// Extracts text from URLs (HTML/PDF) or uploaded files (PDF). Image OCR is not implemented by default.
// Request body:
// - { url: string } OR { file: { name: string, mime: string, base64: string } }
// Response: { text: string }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Lightweight HTML to text
function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // pdfjs-dist via ESM for Deno
  const pdfjs = await import("https://esm.sh/pdfjs-dist@4.6.82");
  // @ts-ignore
  const { getDocument } = pdfjs;
  // Some environments require setting workerSrc; in ESM this can be omitted
  // @ts-ignore
  const loadingTask = getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as any[]).map((it) => (it.str ?? "")).join(" ");
    out += text + "\n";
  }
  return out.trim();
}

async function extractFromUrl(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  const ct = (resp.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/pdf")) {
    const buf = new Uint8Array(await resp.arrayBuffer());
    return await extractPdfText(buf);
  }
  if (ct.startsWith("text/") || ct.includes("html")) {
    const raw = await resp.text();
    const isHtml = ct.includes("html") || /<html[^>]*>/i.test(raw);
    return isHtml ? htmlToText(raw) : raw;
  }
  throw new Error(`Unsupported content-type: ${ct}`);
}

async function extractFromFile(name: string, mime: string, base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
    return await extractPdfText(bytes);
  }
  if (m.startsWith("image/")) {
    throw new Error("Image OCR not enabled. Add Tesseract/WASM to support images.");
  }
  // Fallback: attempt to treat as text
  try {
    const txt = new TextDecoder().decode(bytes);
    return txt.trim();
  } catch (_) {
    throw new Error("Unsupported file type for extraction.");
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { url, file } = body ?? {};

    if (typeof url === "string" && url.length > 0) {
      const text = await extractFromUrl(url);
      return new Response(JSON.stringify({ text }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (file && typeof file.base64 === "string") {
      const text = await extractFromFile(String(file.name || "document"), String(file.mime || "application/octet-stream"), file.base64);
      return new Response(JSON.stringify({ text }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Missing url or file.base64" }), { status: 400, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
});
