import { UserProfile } from '../types';

export const mockUser: UserProfile = {
  id: 'u001',
  name: 'Alex Chen',
  avatar: 'https://picsum.photos/seed/avatar_alex_main/200/200',
  city: 'New York City',
  trustSources: ['Locals', 'Same culture', 'Similar taste', 'Verified visits'],
  tastePreferences: ['Spicy', 'Savory', 'Umami', 'Bold Flavor'],
  dislikes: ['Too Sweet', 'Touristy', 'Overhyped'],
  dietNeeds: [],
  foodScenes: ['Cheap Eats', 'Late-Night', 'Solo Dining', 'Study Cafe'],
  checkInCount: 3,
  savedCount: 6,
  badges: ['Founding Food Scout (Pending)', 'Taste Passport Complete'],
  tastePassportComplete: true,
  foundingScoutProgress: {
    tastePassport: true,
    threeCheckIns: true,
    verifiedCheckIn: true,
    twoInvites: false,
  },
};
