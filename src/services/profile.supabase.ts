import type { UserProfile } from '../../types';
import { getSupabaseClient } from '../lib/supabase';
import { profileFromRow } from './transforms';
import type { ProfileRow, UpdateTastePassportInput, UpsertProfileInput } from './types';

const CITY_LABELS: Record<string, string> = {
  nyc: 'New York City',
  la: 'Los Angeles',
  bay: 'Bay Area',
  sea: 'Seattle',
  bos: 'Boston',
};

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
  if (lower.includes('permission') || lower.includes('policy')) {
    return 'Profile could not be saved because of account permissions.';
  }
  return message || 'Profile request failed. Please try again.';
}

function normalizeCity(city?: string | null): string | null {
  if (!city) {
    return null;
  }
  return CITY_LABELS[city] ?? city;
}

function nonEmptyArray(values?: string[]): string[] {
  return values?.filter(Boolean) ?? [];
}

export function getTastePersona(profileOrInput: UserProfile | UpdateTastePassportInput): string {
  const dietNeeds = profileOrInput.dietNeeds ?? [];
  const tastePreferences = profileOrInput.tastePreferences ?? [];
  const healthyDiets = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free', 'Dairy-Free'];
  if (dietNeeds.some((d) => healthyDiets.includes(d))) {
    return 'Healthy Foodie';
  }
  if (tastePreferences.some((t) => ['Very Spicy', 'Spicy'].includes(t))) {
    return 'Spicy Adventurer';
  }
  if (tastePreferences.includes('Comfort Food')) {
    return 'Comfort Seeker';
  }
  return 'Authentic Explorer';
}

async function getAuthUser() {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  if (!data.user) {
    throw new Error('No signed-in user found.');
  }
  return data.user;
}

async function createFallbackProfile(userId: string): Promise<UserProfile> {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  const metadataName = userData.user?.user_metadata?.name;
  const email = userData.user?.email;
  const name =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim()
      : email?.split('@')[0] || 'New Foodie';

  const { data, error } = await client
    .from('profiles')
    .insert({
      id: userId,
      name,
      taste_passport_complete: false,
    })
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  if (!data) {
    throw new Error('Profile could not be created.');
  }
  return profileFromRow(data as ProfileRow);
}

export async function getProfileById(userId: string): Promise<UserProfile | null> {
  const client = requireClient();
  const [profileResult, verifiedResult] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    // Cheap EXISTS — just need the count, not the rows.
    client
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('location_verified', true)
      .limit(1),
  ]);

  if (profileResult.error) {
    throw new Error(getErrorMessage(profileResult.error.message));
  }
  if (!profileResult.data) {
    return createFallbackProfile(userId);
  }
  const verifiedCheckIn = (verifiedResult.count ?? 0) > 0;
  return profileFromRow(profileResult.data as ProfileRow, { verifiedCheckIn });
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getAuthUser();
  return getProfileById(user.id);
}

export async function upsertProfile(input: UpsertProfileInput): Promise<UserProfile> {
  const client = requireClient();
  const { data: existing, error: existingError } = await client
    .from('profiles')
    .select('*')
    .eq('id', input.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(getErrorMessage(existingError.message));
  }

  const existingRow = existing as ProfileRow | null;
  const payload = {
    id: input.id,
    name: input.name ?? existingRow?.name ?? 'New Foodie',
    avatar_url: input.avatarUrl ?? existingRow?.avatar_url ?? null,
    bio: input.bio ?? existingRow?.bio ?? null,
    city: normalizeCity(input.city) ?? existingRow?.city ?? null,
    trust_sources: input.trustSources ?? existingRow?.trust_sources ?? [],
    taste_preferences: input.tastePreferences ?? existingRow?.taste_preferences ?? [],
    dislikes: input.dislikes ?? existingRow?.dislikes ?? [],
    diet_needs: input.dietNeeds ?? existingRow?.diet_needs ?? [],
    food_scenes: input.foodScenes ?? existingRow?.food_scenes ?? [],
    persona: input.persona ?? existingRow?.persona ?? null,
    taste_passport_complete:
      input.tastePassportComplete ?? existingRow?.taste_passport_complete ?? false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  if (!data) {
    throw new Error('Profile could not be saved.');
  }
  return profileFromRow(data as ProfileRow);
}

export async function updateTastePassport(
  userId: string,
  input: UpdateTastePassportInput
): Promise<UserProfile> {
  const persona = getTastePersona(input);
  const { data: existing, error: existingError } = await requireClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(getErrorMessage(existingError.message));
  }

  if (!existing) {
    await createFallbackProfile(userId);
  }

  const client = requireClient();
  const { data, error } = await client
    .from('profiles')
    .update({
      city: normalizeCity(input.city),
      trust_sources: nonEmptyArray(input.trustSources),
      taste_preferences: nonEmptyArray(input.tastePreferences),
      dislikes: nonEmptyArray(input.dislikes),
      diet_needs: nonEmptyArray(input.dietNeeds).filter((d) => d !== 'None'),
      food_scenes: nonEmptyArray(input.foodScenes),
      persona,
      taste_passport_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  if (!data) {
    throw new Error('Taste Passport could not be saved.');
  }
  return profileFromRow(data as ProfileRow);
}

export function completeTastePassport(
  userId: string,
  input: UpdateTastePassportInput
): Promise<UserProfile> {
  return updateTastePassport(userId, input);
}
