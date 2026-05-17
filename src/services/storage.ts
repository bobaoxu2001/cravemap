// src/services/storage.ts
import type { UploadResult } from './types';
import { USE_SUPABASE } from './config';
import * as mock from './storage.mock';
import * as supabase from './storage.supabase';

export function uploadAvatar(userId: string, localUri: string): Promise<UploadResult> {
  if (!USE_SUPABASE) {
    return mock.uploadAvatar(userId, localUri);
  }
  return supabase.uploadAvatar(userId, localUri);
}

export function uploadCheckInPhoto(
  userId: string,
  checkInId: string,
  localUri: string,
  index = 0
): Promise<UploadResult> {
  if (!USE_SUPABASE) {
    return mock.uploadCheckInPhoto(userId, checkInId, localUri);
  }
  return supabase.uploadCheckInPhoto(userId, checkInId, localUri, index);
}

export async function uploadCheckInPhotos(
  userId: string,
  checkInId: string,
  localUris: string[]
): Promise<UploadResult[]> {
  if (!localUris.length) return [];
  if (!USE_SUPABASE) {
    return Promise.all(
      localUris.map((uri) => mock.uploadCheckInPhoto(userId, checkInId, uri))
    );
  }
  return supabase.uploadCheckInPhotos(userId, checkInId, localUris);
}
