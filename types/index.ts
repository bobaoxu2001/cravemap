export interface Restaurant {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  cuisine: string;
  price: '$' | '$$' | '$$$' | '$$$$';
  tasteMatchPercent: number;
  localApprovedPercent: number;
  verifiedCheckIns: number;
  tags: string[];
  recommendationReason: string;
  description: string;
  address: string;
  hours: string;
  phone?: string;
  website?: string;
  images: string[];
  latitude: number;
  longitude: number;
  bestFor: string[];
  avoidIf: string[];
  categories: string[];
  isOpen: boolean;
  waitTime?: string;
}

export interface CheckIn {
  id: string;
  restaurantId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  photos: string[];
  review: string;
  tasteTags: string[];
  dietTags: string[];
  sceneTags: string[];
  isRepeatVisit: boolean;
  hypeRating: 'worth_it' | 'overhyped' | 'not_sure';
  locationVerified: boolean;
  helpful: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  city: string;
  trustSources: string[];
  tastePreferences: string[];
  dislikes: string[];
  dietNeeds: string[];
  foodScenes: string[];
  checkInCount: number;
  savedCount: number;
  badges: string[];
  tastePassportComplete: boolean;
  foundingScoutProgress: {
    tastePassport: boolean;
    threeCheckIns: boolean;
    verifiedCheckIn: boolean;
    twoInvites: boolean;
  };
}
