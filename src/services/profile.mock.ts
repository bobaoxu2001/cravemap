import type { UserProfile } from '../../types';
import { mockUser } from '../../data/mockUser';
import type { UpdateTastePassportInput, UpsertProfileInput } from './types';

export function getCurrentProfile(): Promise<UserProfile | null> {
  return Promise.resolve({ ...mockUser });
}

export function getProfileById(_userId: string): Promise<UserProfile | null> {
  return Promise.resolve({ ...mockUser });
}

export function updateTastePassport(
  userIdOrInput: string | UpdateTastePassportInput,
  maybeInput?: UpdateTastePassportInput
): Promise<UserProfile> {
  const input = typeof userIdOrInput === 'string' ? maybeInput ?? {} : userIdOrInput;
  const merged: UserProfile = {
    ...mockUser,
    city: input.city ?? mockUser.city,
    trustSources: input.trustSources ?? mockUser.trustSources,
    tastePreferences: input.tastePreferences ?? mockUser.tastePreferences,
    dislikes: input.dislikes ?? mockUser.dislikes,
    dietNeeds: input.dietNeeds ?? mockUser.dietNeeds,
    foodScenes: input.foodScenes ?? mockUser.foodScenes,
  };
  return Promise.resolve(merged);
}

export function completeTastePassport(
  userId: string,
  input: UpdateTastePassportInput
): Promise<UserProfile> {
  return updateTastePassport(userId, input);
}

export function upsertProfile(_input: UpsertProfileInput): Promise<UserProfile> {
  return Promise.resolve({ ...mockUser });
}

export function getTastePersona(profileOrInput: UserProfile | UpdateTastePassportInput): string {
  const dietNeeds = profileOrInput.dietNeeds ?? [];
  const tastePreferences = profileOrInput.tastePreferences ?? [];
  const dietHealthy = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free', 'Dairy-Free'];
  if (dietNeeds.some((d) => dietHealthy.includes(d))) {
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
