import { supabase } from './supabase';
import { CLOUDINARY_CLOUD_NAME } from './config';

export type CloudinaryUploadResult = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename: string;
};

export async function getSignedUploadParams(folder = 'suvidhaa') {
  const { data, error } = await supabase.functions.invoke('cloudinary-sign-upload', {
    body: { folder },
  });
  if (error) throw error;
  return data as { apiKey: string; signature: string; timestamp: number; folder: string; cloudName?: string };
}

export async function uploadToCloudinary(file: { uri: string; name?: string; type?: string }, opts?: { folder?: string }) {
  const { apiKey, signature, timestamp, folder } = await getSignedUploadParams(opts?.folder);

  const form = new FormData();
  form.append('file', {
    // @ts-expect-error -- React Native FormData requires this shape
    uri: file.uri,
    name: file.name ?? 'upload',
    type: file.type ?? 'application/octet-stream',
  });
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  if (folder) form.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${t}`);
  }
  return (await res.json()) as CloudinaryUploadResult;
}
