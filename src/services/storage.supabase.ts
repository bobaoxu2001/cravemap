import { getSupabaseClient } from '../lib/supabase';
import type { UploadResult } from './types';

const CHECK_IN_BUCKET = 'check-in-photos';
const AVATAR_BUCKET = 'avatars';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or run in mock mode.'
    );
  }
  return client;
}

function inferContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

function inferExtension(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/heic') return 'heic';
  return 'jpg';
}

async function readAsArrayBuffer(localUri: string): Promise<ArrayBuffer> {
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error(`Failed to read local image (${response.status}).`);
  }
  return response.arrayBuffer();
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = requireClient().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, localUri: string): Promise<UploadResult> {
  if (!userId) {
    throw new Error('User ID required to upload an avatar.');
  }
  const contentType = inferContentType(localUri);
  const ext = inferExtension(contentType);
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const body = await readAsArrayBuffer(localUri);

  const { error } = await requireClient()
    .storage
    .from(AVATAR_BUCKET)
    .upload(path, body, { contentType, upsert: true });

  if (error) {
    throw new Error(error.message || 'Avatar upload failed.');
  }
  return { url: getPublicUrl(AVATAR_BUCKET, path), path };
}

export async function uploadCheckInPhoto(
  userId: string,
  checkInId: string,
  localUri: string,
  index = 0
): Promise<UploadResult> {
  if (!userId) {
    throw new Error('User ID required to upload check-in photos.');
  }
  if (!checkInId) {
    throw new Error('Check-in ID required to upload check-in photos.');
  }
  if (!localUri) {
    throw new Error('Local image URI is missing.');
  }

  const contentType = inferContentType(localUri);
  const ext = inferExtension(contentType);
  const path = `${userId}/${checkInId}/${index}.${ext}`;
  const body = await readAsArrayBuffer(localUri);

  const { error } = await requireClient()
    .storage
    .from(CHECK_IN_BUCKET)
    .upload(path, body, { contentType, upsert: true });

  if (error) {
    throw new Error(error.message || 'Photo upload failed.');
  }
  return { url: getPublicUrl(CHECK_IN_BUCKET, path), path };
}

export async function uploadCheckInPhotos(
  userId: string,
  checkInId: string,
  localUris: string[]
): Promise<UploadResult[]> {
  if (!localUris.length) return [];
  const results = await Promise.allSettled(
    localUris.map((uri, idx) => uploadCheckInPhoto(userId, checkInId, uri, idx))
  );
  const successes: UploadResult[] = [];
  const failures: string[] = [];
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      successes.push(result.value);
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      failures.push(`#${idx + 1}: ${reason}`);
    }
  });
  if (!successes.length && failures.length) {
    throw new Error(`All photo uploads failed. ${failures[0]}`);
  }
  if (failures.length && __DEV__) {
    console.warn('[CraveMap] Some check-in photos failed to upload:', failures);
  }
  return successes;
}
