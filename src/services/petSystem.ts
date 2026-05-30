import { UserProfile } from '../../types';

export interface PetLevelDef {
  level: number;
  title: string;
  titleZh: string;
  emoji: string;
  accentColor: string;
  xpRequired: number;
  unlockDesc: string;
}

export interface PetStats {
  level: number;
  title: string;
  titleZh: string;
  emoji: string;
  accentColor: string;
  totalXP: number;
  levelStartXP: number;
  nextLevelXP: number;
  progressInLevel: number; // 0–1
  isMaxLevel: boolean;
  xpToNextLevel: number;
  nextLevel: PetLevelDef | null;
}

export interface XPSource {
  label: string;
  labelZh: string;
  xpPerAction: number;
  totalXP: number;
  earned: boolean;
}

export const PET_LEVELS: PetLevelDef[] = [
  {
    level: 1,
    title: 'Hatchling',
    titleZh: '小蛋蛋',
    emoji: '🥚',
    accentColor: '#B0BEC5',
    xpRequired: 0,
    unlockDesc: 'Just hatched. Time to explore!',
  },
  {
    level: 2,
    title: 'Curious Eater',
    titleZh: '小吃货',
    emoji: '🐣',
    accentColor: '#FFB800',
    xpRequired: 100,
    unlockDesc: 'Taste Passport badge unlocked',
  },
  {
    level: 3,
    title: 'Food Scout',
    titleZh: '美食侦探',
    emoji: '🍜',
    accentColor: '#4CAF7D',
    xpRequired: 350,
    unlockDesc: 'Local Scout badge + glow effect',
  },
  {
    level: 4,
    title: 'Taste Expert',
    titleZh: '美食达人',
    emoji: '🦊',
    accentColor: '#E8450A',
    xpRequired: 750,
    unlockDesc: 'Expert badge + sparkles',
  },
  {
    level: 5,
    title: 'Legend',
    titleZh: '美食传奇',
    emoji: '⭐',
    accentColor: '#7B9EFF',
    xpRequired: 1400,
    unlockDesc: 'Legendary status — permanent on your profile',
  },
];

// ─── XP Calculation ───────────────────────────────────────────────────────────

export function calculateTotalXP(profile: UserProfile): number {
  // Defensive: an older/partial AsyncStorage payload may lack
  // foundingScoutProgress, and dereferencing it directly crashes the pet screen.
  const fsp = profile.foundingScoutProgress;
  let xp = 0;
  xp += (profile.checkInCount ?? 0) * 50;
  if (fsp?.tastePassport) xp += 200;
  if (fsp?.threeCheckIns) xp += 75;
  if (fsp?.verifiedCheckIn) xp += 150;
  if (fsp?.twoInvites) xp += 150;
  return xp;
}

export function getXPSources(profile: UserProfile): XPSource[] {
  const fsp = profile.foundingScoutProgress;
  const checkInCount = profile.checkInCount ?? 0;
  return [
    {
      label: 'Check-ins',
      labelZh: '打卡',
      xpPerAction: 50,
      totalXP: checkInCount * 50,
      earned: checkInCount > 0,
    },
    {
      label: 'Taste Passport',
      labelZh: '口味护照',
      xpPerAction: 200,
      totalXP: 200,
      earned: !!fsp?.tastePassport,
    },
    {
      label: '3 Check-ins',
      labelZh: '三次打卡',
      xpPerAction: 75,
      totalXP: 75,
      earned: !!fsp?.threeCheckIns,
    },
    {
      label: 'Verified visit',
      labelZh: '认证到访',
      xpPerAction: 150,
      totalXP: 150,
      earned: !!fsp?.verifiedCheckIn,
    },
    {
      label: '2 Invites',
      labelZh: '邀请好友',
      xpPerAction: 150,
      totalXP: 150,
      earned: !!fsp?.twoInvites,
    },
  ];
}

// ─── Level Calculation ────────────────────────────────────────────────────────

export function getPetStats(profile: UserProfile): PetStats {
  const totalXP = calculateTotalXP(profile);

  let currentDef = PET_LEVELS[0];
  for (let i = PET_LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= PET_LEVELS[i].xpRequired) {
      currentDef = PET_LEVELS[i];
      break;
    }
  }

  const isMaxLevel = currentDef.level === PET_LEVELS[PET_LEVELS.length - 1].level;
  const nextDef = isMaxLevel ? null : PET_LEVELS[currentDef.level]; // next index = current level (0-indexed)

  const levelStartXP = currentDef.xpRequired;
  const nextLevelXP = nextDef?.xpRequired ?? totalXP;
  const rangeSize = nextLevelXP - levelStartXP;
  const progressInLevel = isMaxLevel ? 1 : Math.min((totalXP - levelStartXP) / rangeSize, 1);

  return {
    level: currentDef.level,
    title: currentDef.title,
    titleZh: currentDef.titleZh,
    emoji: currentDef.emoji,
    accentColor: currentDef.accentColor,
    totalXP,
    levelStartXP,
    nextLevelXP,
    progressInLevel,
    isMaxLevel,
    xpToNextLevel: isMaxLevel ? 0 : nextLevelXP - totalXP,
    nextLevel: nextDef ?? null,
  };
}

export function getXPForCheckIn(locationVerified: boolean): number {
  return locationVerified ? 150 : 50;
}
