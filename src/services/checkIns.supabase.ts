import type { CheckIn } from '../../types';
import { getSupabaseClient } from '../lib/supabase';
import { checkInFromRow } from './transforms';
import type { CheckInRow, CreateCheckInInput } from './types';

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

export async function createCheckIn(input: CreateCheckInInput): Promise<CheckIn> {
  const client = requireClient();

  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be signed in to check in.');
  }

  const { data, error } = await client
    .from('check_ins')
    .insert({
      user_id: user.id,
      restaurant_id: input.restaurantId,
      review: input.review,
      photos: [],
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

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  return checkInFromRow(data as unknown as CheckInRow);
}

export async function markHelpful(_checkInId: string): Promise<void> {
  // No-op: helpful counting requires a dedicated RPC or trigger to avoid race conditions.
  // Will be wired in a future commit.
  return Promise.resolve();
}
