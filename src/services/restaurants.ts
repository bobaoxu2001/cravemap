// src/services/restaurants.ts
import { USE_SUPABASE } from './config';
import * as mock from './restaurants.mock';
// TODO(supabase commit 3+): import * as supabase from './restaurants.supabase';

const impl = USE_SUPABASE ? mock : mock; // swap to supabase in future commit

export const getAllRestaurants = impl.getAllRestaurants;
export const getRestaurantsByCity = impl.getRestaurantsByCity;
export const getRestaurantById = impl.getRestaurantById;
export const getRestaurantsByCategory = impl.getRestaurantsByCategory;
export const getTrendingRestaurants = impl.getTrendingRestaurants;
export const getHiddenGemRestaurants = impl.getHiddenGemRestaurants;
export const searchRestaurants = impl.searchRestaurants;
