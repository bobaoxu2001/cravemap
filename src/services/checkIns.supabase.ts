import type { CheckIn } from '../../types';
import { getSupabaseClient } from '../lib/supabase';
import { checkInFromRow } from './transforms';
import { uploadCheckInPhotos } from './storage.supabase';
import type { CheckInRow, CreateCheckInInput, CreateCheckInResult, MarkHelpfulResult } from './types';

function isLocalUri(uri: string): boolean {
  return /^(file:|content:|ph:|assets-library:|blob:|data:)/i.test(uri);
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or run in mock mode.'
    );
  }
  return client;
}

function getErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (lower.includes('violates foreign key') || lower.includes('violates not-null')) {
    return 'Check-in data is incomplete. Please try again.';
  }
  if (lower.includes('permission') || lower.includes('policy') || lower.includes('row-level')) {
    return 'Not authorized. Please sign in and try again.';
  }
  return message || 'Check-in request failed. Please try again.';
}

const CHECK_IN_SELECT = '*, profiles(name, avatar_url)';

type CheckInQuery = any;

async function execute(query: CheckInQuery): Promise<CheckIn[]> {
  const { data, error } = await query;
  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  return ((data ?? []) as unknown as CheckInRow[]).map(checkInFromRow);
}

export function getAllCheckIns(): Promise<CheckIn[]> {
  return execute(
    requireClient()
      .from('check_ins')
      .select(CHECK_IN_SELECT)
      .order('created_at', { ascending: false })
      .limit(100)
  );
}

export function getCheckInsByRestaurantId(restaurantId: string): Promise<CheckIn[]> {
  return execute(
    requireClient()
      .from('check_ins')
      .select(CHECK_IN_SELECT)
      .eq('restaurant_id', restaurantId)
      .order('helpful_count', { ascending: false })
      .order('created_at', { ascending: false })
  );
}

export function getCheckInsByUserId(userId: string): Promise<CheckIn[]> {
  return execute(
    requireClient()
      .from('check_ins')
      .select(CHECK_IN_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );
}

export async function createCheckIn(input: CreateCheckInInput): Promise<CreateCheckInResult> {
  const client = requireClient();

  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be signed in to check in.');
  }

  const inputPhotos = input.photos ?? [];
  const localPhotos = inputPhotos.filter(isLocalUri);
  const remotePhotos = inputPhotos.filter((uri) => !isLocalUri(uri));

  const { data: insertData, error: insertError } = await client
    .from('check_ins')
    .insert({
      user_id: user.id,
      restaurant_id: input.restaurantId,
      review: input.review,
      photos: remotePhotos,
      ordered_items: input.orderedItems ?? [],
      taste_tags: input.tasteTags ?? [],
      diet_tags: input.dietTags ?? [],
      scene_tags: input.sceneTags ?? [],
      is_repeat_visit: input.isRepeatVisit ?? false,
      would_return: input.wouldReturn ?? null,
      hype_rating: input.hypeRating,
      location_verified: input.locationVerified ?? false,
    })
    .select(CHECK_IN_SELECT)
    .single();

  // Insert failure is the only fatal case — the row does not exist, retry is safe.
  if (insertError) {
    throw new Error(getErrorMessage(insertError.message));
  }

  const insertedRow = insertData as unknown as CheckInRow;
  const baseCheckIn = checkInFromRow(insertedRow);

  if (!localPhotos.length) {
    return baseCheckIn;
  }

  // From this point on the check-in row exists. Never throw — return a
  // CreateCheckInResult with an optional warning so the caller does not
  // retry and create a duplicate row.
  let uploadedUrls: string[] = [];
  let warning: string | undefined;

  try {
    const uploads = await uploadCheckInPhotos(user.id, insertedRow.id, localPhotos);
    uploadedUrls = uploads.map((u) => u.url);
    if (uploadedUrls.length < localPhotos.length) {
      const missing = localPhotos.length - uploadedUrls.length;
      warning = `Check-in posted, but ${missing} of ${localPhotos.length} photo${missing === 1 ? '' : 's'} couldn't upload.`;
    }
  } catch (uploadError) {
    if (__DEV__) {
      const msg = uploadError instanceof Error ? uploadError.message : String(uploadError);
      console.warn('[CraveMap] All photo uploads failed:', msg);
    }
    warning = "Check-in posted, but photos couldn't upload. You can edit the post later to add them.";
  }

  if (uploadedUrls.length === 0) {
    return { ...baseCheckIn, warning };
  }

  const finalPhotos = [...remotePhotos, ...uploadedUrls];

  const { data: updateData, error: updateError } = await client
    .from('check_ins')
    .update({ photos: finalPhotos })
    .eq('id', insertedRow.id)
    .select(CHECK_IN_SELECT)
    .single();

  if (updateError) {
    if (__DEV__) {
      console.warn('[CraveMap] Failed to attach uploaded photos to check-in row:', updateError.message);
    }
    return {
      ...checkInFromRow({ ...insertedRow, photos: finalPhotos }),
      warning: warning ?? 'Check-in posted. Photos may take a moment to show up.',
    };
  }

  return { ...checkInFromRow(updateData as unknown as CheckInRow), warning };
}

interface IncrementHelpfulRpcResponse {
  success: boolean;
  helpful_count?: number;
  already_marked?: boolean;
  error?: string;
}

function isIncrementHelpfulResponse(value: unknown): value is IncrementHelpfulRpcResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { success?: unknown }).success === 'boolean'
  );
}

export async function markHelpful(checkInId: string): Promise<MarkHelpfulResult> {
  if (!checkInId) {
    return { success: false, helpfulCount: 0, error: 'Missing check-in id.' };
  }

  const client = requireClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    return { success: false, helpfulCount: 0, error: 'You must be signed in to mark a check-in helpful.' };
  }

  // Delegate to the security-definer RPC for atomic insert+increment.
  const { data, error } = await client.rpc('increment_check_in_helpful', { p_check_in_id: checkInId });

  if (error) {
    return { success: false, helpfulCount: 0, error: error.message || 'Could not mark helpful. Please try again.' };
  }

  if (!isIncrementHelpfulResponse(data)) {
    return { success: false, helpfulCount: 0, error: 'Could not mark helpful. Please try again.' };
  }

  if (!data.success) {
    return { success: false, helpfulCount: 0, error: data.error ?? 'Could not mark helpful. Please try again.' };
  }

  return {
    success: true,
    helpfulCount: data.helpful_count ?? 0,
    alreadyMarked: data.already_marked ?? false,
  };
}
