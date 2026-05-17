import type { CheckIn } from '../../types';
import { mockCheckIns } from '../../data/mockCheckIns';
import { mockUser } from '../../data/mockUser';
import type { CreateCheckInInput, CreateCheckInResult } from './types';

export function getAllCheckIns(): Promise<CheckIn[]> {
  return Promise.resolve(mockCheckIns);
}

export function getCheckInsByRestaurantId(
  restaurantId: string
): Promise<CheckIn[]> {
  return Promise.resolve(
    mockCheckIns.filter((c) => c.restaurantId === restaurantId)
  );
}

export function getCheckInsByUserId(userId: string): Promise<CheckIn[]> {
  return Promise.resolve(mockCheckIns.filter((c) => c.userId === userId));
}

export function createCheckIn(input: CreateCheckInInput): Promise<CreateCheckInResult> {
  // Real persistence comes with Supabase wiring. For now we construct
  // and return a new CheckIn without mutating mockCheckIns.
  const checkIn: CreateCheckInResult = {
    id: `c_${Date.now()}`,
    restaurantId: input.restaurantId,
    userId: mockUser.id,
    userName: mockUser.name,
    userAvatar: mockUser.avatar,
    date: new Date().toISOString().split('T')[0],
    photos: input.photos ?? [],
    review: input.review,
    tasteTags: input.tasteTags ?? [],
    dietTags: input.dietTags ?? [],
    sceneTags: input.sceneTags ?? [],
    isRepeatVisit: input.isRepeatVisit ?? false,
    hypeRating: input.hypeRating,
    locationVerified: input.locationVerified ?? false,
    helpful: 0,
    orderedItems: input.orderedItems,
    wouldReturn: input.wouldReturn,
  };
  return Promise.resolve(checkIn);
}

export function markHelpful(_checkInId: string): Promise<void> {
  // No-op in mock; real impl will increment helpful count in Supabase.
  return Promise.resolve();
}
