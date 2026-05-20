import type { CheckIn } from '../../types';
import { mockCheckIns } from '../../data/mockCheckIns';
import { mockUser } from '../../data/mockUser';
import type { CreateCheckInInput, CreateCheckInResult, MarkHelpfulResult } from './types';

// In-memory dedup so a user can't mark the same check-in helpful twice in
// a single mock session. Survives within the JS runtime; resets on reload.
const MOCK_MARKED = new Set<string>();
const MOCK_COUNTS = new Map<string, number>();
const MOCK_USER_ID = 'u001';

// In-memory accumulator for check-ins created during this mock session.
// These are merged into query results so newly-posted check-ins appear
// in the feed and My Check-ins without requiring real DB persistence.
const pendingCheckIns: CheckIn[] = [];

function allCheckIns(): CheckIn[] {
  return [...mockCheckIns, ...pendingCheckIns];
}

export function getAllCheckIns(): Promise<CheckIn[]> {
  return Promise.resolve(allCheckIns());
}

export function getCheckInsByRestaurantId(
  restaurantId: string
): Promise<CheckIn[]> {
  return Promise.resolve(
    allCheckIns().filter((c) => c.restaurantId === restaurantId)
  );
}

export function getCheckInsByUserId(userId: string): Promise<CheckIn[]> {
  return Promise.resolve(allCheckIns().filter((c) => c.userId === userId));
}

export function createCheckIn(input: CreateCheckInInput): Promise<CreateCheckInResult> {
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
  // Persist within the JS runtime so the feed reflects the new post.
  pendingCheckIns.unshift(checkIn);
  return Promise.resolve(checkIn);
}

export function getHelpfulCheckInIds(
  _userId: string,
  checkInIds: string[]
): Promise<string[]> {
  const marked = checkInIds.filter((id) => MOCK_MARKED.has(`${MOCK_USER_ID}:${id}`));
  return Promise.resolve(marked);
}

export function markHelpful(checkInId: string): Promise<MarkHelpfulResult> {
  if (!checkInId) {
    return Promise.resolve({ success: false, helpfulCount: 0, error: 'Missing check-in id.' });
  }

  const key = `${MOCK_USER_ID}:${checkInId}`;
  const baseCount =
    MOCK_COUNTS.get(checkInId) ??
    allCheckIns().find((c) => c.id === checkInId)?.helpful ??
    0;

  if (MOCK_MARKED.has(key)) {
    return Promise.resolve({
      success: true,
      helpfulCount: baseCount,
      alreadyMarked: true,
    });
  }

  const nextCount = baseCount + 1;
  MOCK_MARKED.add(key);
  MOCK_COUNTS.set(checkInId, nextCount);

  return Promise.resolve({
    success: true,
    helpfulCount: nextCount,
    alreadyMarked: false,
  });
}
