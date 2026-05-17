import * as ImageManipulator from 'expo-image-manipulator';
import { getSupabaseClient } from '../lib/supabase';
import type { UploadResult } from './types';

const CHECK_IN_BUCKET = 'check-in-photos';
const AVATAR_BUCKET = 'avatars';

const MAX_LONGEST_SIDE = 1920;
const JPEG_QUALITY = 0.75;

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or run in mock mode.'
    );
  }
  return client;
}

interface PreparedImage {
  uri: string;
  contentType: string;
  ext: string;
}

/**
 * Resize + recompress to JPEG so uploads are predictable across iOS HEIC,
 * PNG, WebP, and Android content://. Falls back to the original URI with
 * inferred MIME if manipulation throws.
 */
async function prepareImage(localUri: string): Promise<PreparedImage> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: MAX_LONGEST_SIDE } }],
      {
        compress: JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return { uri: result.uri, contentType: 'image/jpeg', ext: 'jpg' };
  } catch (err) {
    if (__DEV__) {
      console.warn('[CraveMap] Image manipulator failed; uploading original.', err);
    }
    return { uri: localUri, contentType: 'image/jpeg', ext: 'jpg' };
  }
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
  const prepared = await prepareImage(localUri);
  const path = `${userId}/avatar-${Date.now()}.${prepared.ext}`;
  const body = await readAsArrayBuffer(prepared.uri);

  const { error } = await requireClient()
    .storage
    .from(AVATAR_BUCKET)
    .upload(path, body, { contentType: prepared.contentType, upsert: true });

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

  const prepared = await prepareImage(localUri);
  const path = `${userId}/${checkInId}/${index}.${prepared.ext}`;
  const body = await readAsArrayBuffer(prepared.uri);

  const { error } = await requireClient()
    .storage
    .from(CHECK_IN_BUCKET)
    .upload(path, body, { contentType: prepared.contentType, upsert: true });

  if (error) {
    throw new Error(error.message || 'Photo upload failed.');
  }
  return { url: getPublicUrl(CHECK_IN_BUCKET, path), path };
}

/**
 * Uploads check-in photos sequentially to avoid peak memory pressure when
 * users attach 4–6 large photos. Partial failures are tolerated: returns
 * the successful uploads and throws only if every photo fails.
 */
export async function uploadCheckInPhotos(
  userId: string,
  checkInId: string,
  localUris: string[]
): Promise<UploadResult[]> {
  if (!localUris.length) return [];

  const successes: UploadResult[] = [];
  const failures: string[] = [];

  for (let i = 0; i < localUris.length; i++) {
    try {
      const result = await uploadCheckInPhoto(userId, checkInId, localUris[i], i);
      successes.push(result);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push(`#${i + 1}: ${reason}`);
    }
  }

  if (!successes.length && failures.length) {
    throw new Error(`All photo uploads failed. ${failures[0]}`);
  }
  if (failures.length && __DEV__) {
    console.warn('[CraveMap] Some check-in photos failed to upload:', failures);
  }
  return successes;
}
