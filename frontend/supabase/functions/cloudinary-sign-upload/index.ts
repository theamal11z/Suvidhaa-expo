// Supabase Edge Function: cloudinary-sign-upload
// Generates a short-lived SHA1 signature for Cloudinary secure uploads.
// Secrets required (set in Supabase): CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { crypto } from "jsr:@std/crypto@0.224.0/crypto";

async function sha1Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-1", data);
  const bytes = new Uint8Array(hashBuf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { folder = "suvidhaa", timestamp = Math.floor(Date.now() / 1000) } = await req.json().catch(() => ({}));

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "Missing Cloudinary secrets in environment" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({ folder: String(folder), timestamp: String(timestamp) });
    const toSign = params.toString() + apiSecret;
    const signature = await sha1Hex(toSign);

    return new Response(
      JSON.stringify({ cloudName, apiKey, timestamp, folder, signature }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
