import type { UserProfile } from '../../types';
import { mockUser } from '../../data/mockUser';
import type { UpdateTastePassportInput } from './types';

export function getCurrentProfile(): Promise<UserProfile | null> {
  return Promise.resolve({ ...mockUser });
}

export function updateTastePassport(
  input: UpdateTastePassportInput
): Promise<UserProfile> {
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

export function getTastePersona(profile: UserProfile): string {
  const dietHealthy = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free'];
  if (profile.dietNeeds.some((d) => dietHealthy.includes(d))) {
    return 'Healthy Foodie';
  }
  if (profile.tastePreferences.some((t) => ['Very Spicy', 'Spicy'].includes(t))) {
    return 'Spicy Adventurer';
  }
  if (profile.tastePreferences.includes('Comfort Food')) {
    return 'Comfort Seeker';
  }
  return 'Authentic Explorer';
}
