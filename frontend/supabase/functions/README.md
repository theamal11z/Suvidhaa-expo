# Supabase Edge Functions

This folder contains Edge Functions to support text extraction, Cloudinary uploads, and NVIDIA LLM calls.

## Functions

- `extract-text`
  - POST: `{ url: string }` OR `{ file: { name: string, mime: string, base64: string } }`
  - Returns: `{ text: string }`
  - Notes: Supports HTML/text and PDF extraction. Image OCR is not included by default.

- `cloudinary-sign-upload`
  - POST: `{ folder?: string }`
  - Returns: `{ cloudName, apiKey, timestamp, folder, signature }`
  - Use this from the mobile app to obtain a short‑lived signature for uploading directly to Cloudinary.

- `llm-proxy`
  - POST: `{ messages?: Array<{role: 'system'|'user'|'assistant', content: string}>, prompt?: string, model?: string, temperature?: number, max_tokens?: number }`
  - Returns: NVIDIA Integrate API chat completion response JSON

## Prerequisites

- Supabase CLI installed: https://supabase.com/docs/guides/cli
- Logged in to Supabase and linked project in this directory (or run commands with `-p <project-ref>`)

## Set Function Secrets

Replace values with your rotated credentials.

```bash
# Cloudinary
supabase functions secrets set \
  CLOUDINARY_CLOUD_NAME=dc2hnehcz \
  CLOUDINARY_API_KEY=REDACTED \
  CLOUDINARY_API_SECRET=REDACTED \
  --project-ref YOUR_PROJECT_REF

# NVIDIA
supabase functions secrets set \
  NVIDIA_API_KEY=REDACTED \
  NVIDIA_MODEL=meta/llama-4-scout-17b-16e-instruct \
  --project-ref YOUR_PROJECT_REF
```

## Deploy

```bash
# From the frontend/ directory
supabase functions deploy extract-text --project-ref YOUR_PROJECT_REF
supabase functions deploy cloudinary-sign-upload --project-ref YOUR_PROJECT_REF
supabase functions deploy llm-proxy --project-ref YOUR_PROJECT_REF
```

## Invoke (test)

```bash
supabase functions invoke cloudinary-sign-upload --no-verify-jwt --project-ref YOUR_PROJECT_REF --body '{"folder":"suvidhaa"}'

supabase functions invoke extract-text --no-verify-jwt --project-ref YOUR_PROJECT_REF --body '{"url":"https://example.com"}'
supabase functions invoke llm-proxy --no-verify-jwt --project-ref YOUR_PROJECT_REF --body '{"prompt":"Summarize: Hello world"}'
```

Note: In production, configure Auth to require a valid JWT if desired. For development you can use `--no-verify-jwt`.
