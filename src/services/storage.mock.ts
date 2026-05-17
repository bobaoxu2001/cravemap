import type { UploadResult } from './types';

// In mock mode, no actual upload happens. Returns deterministic placeholder URLs.
export function uploadAvatar(
  userId: string,
  _localUri: string
): Promise<UploadResult> {
  return Promise.resolve({
    url: `https://picsum.photos/seed/mock_avatar_${userId}/200/200`,
    path: `mock://${userId}/avatar.jpg`,
  });
}

// In mock mode, no actual upload happens. Returns deterministic placeholder URLs.
export function uploadCheckInPhoto(
  userId: string,
  checkInId: string,
  _localUri: string
): Promise<UploadResult> {
  return Promise.resolve({
    url: `https://picsum.photos/seed/mock_checkin_${userId}_${checkInId}/400/300`,
    path: `mock://${userId}/checkins/${checkInId}.jpg`,
  });
}
