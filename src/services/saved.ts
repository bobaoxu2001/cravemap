// src/services/saved.ts
import { USE_SUPABASE } from './config';
import * as mock from './saved.mock';
// TODO(supabase commit 3+): import * as supabase from './saved.supabase';

const impl = USE_SUPABASE ? mock : mock; // swap to supabase in future commit

export const getSavedRestaurants = impl.getSavedRestaurants;
export const isRestaurantSaved = impl.isRestaurantSaved;
export const saveRestaurant = impl.saveRestaurant;
export const unsaveRestaurant = impl.unsaveRestaurant;
