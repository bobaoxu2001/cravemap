// src/services/checkIns.ts
import { USE_SUPABASE } from './config';
import * as mock from './checkIns.mock';
// TODO(supabase commit 3+): import * as supabase from './checkIns.supabase';

const impl = USE_SUPABASE ? mock : mock; // swap to supabase in future commit

export const getAllCheckIns = impl.getAllCheckIns;
export const getCheckInsByRestaurantId = impl.getCheckInsByRestaurantId;
export const getCheckInsByUserId = impl.getCheckInsByUserId;
export const createCheckIn = impl.createCheckIn;
export const markHelpful = impl.markHelpful;
