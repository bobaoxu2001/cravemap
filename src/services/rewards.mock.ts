import type { UserProfile, CheckIn } from '../../types';
import { mockUser } from '../../data/mockUser';
import { mockCheckIns } from '../../data/mockCheckIns';
import type { FoundingScoutProgress, RewardTask } from './types';

export function calculateProgress(
  profile: UserProfile,
  checkIns: CheckIn[],
  inviteCount: number
): FoundingScoutProgress {
  const tastePassport = profile.tastePassportComplete;
  const threeCheckIns = checkIns.length >= 3;
  const verifiedCheckIn = checkIns.some((c) => c.locationVerified);
  const twoInvites = inviteCount >= 2;
  const flags = [tastePassport, threeCheckIns, verifiedCheckIn, twoInvites];
  const completedCount = flags.filter(Boolean).length;
  const totalCount = 4;
  return {
    tastePassport,
    threeCheckIns,
    verifiedCheckIn,
    twoInvites,
    completedCount,
    totalCount,
    percentComplete: completedCount / totalCount,
  };
}

export function getFoundingScoutProgress(
  _userId: string
): Promise<FoundingScoutProgress> {
  const userCheckIns = mockCheckIns.filter((c) => c.userId === mockUser.id);
  return Promise.resolve(calculateProgress(mockUser, userCheckIns, 0));
}

export function getRewardTasks(_userId: string): Promise<RewardTask[]> {
  const userCheckIns = mockCheckIns.filter((c) => c.userId === mockUser.id);
  const progress = calculateProgress(mockUser, userCheckIns, 0);
  const tasks: RewardTask[] = [
    {
      key: 'tastePassport',
      label: 'Complete Taste Passport',
      done: progress.tastePassport,
      points: 50,
    },
    {
      key: 'threeCheckIns',
      label: 'Post 3 real check-ins',
      done: progress.threeCheckIns,
      points: 150,
    },
    {
      key: 'verifiedCheckIn',
      label: 'Get 1 location-verified check-in',
      done: progress.verifiedCheckIn,
      points: 100,
    },
    {
      key: 'twoInvites',
      label: 'Invite 2 friends',
      done: progress.twoInvites,
      points: 100,
    },
  ];
  return Promise.resolve(tasks);
}
