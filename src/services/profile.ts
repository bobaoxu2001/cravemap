// src/services/profile.ts
import { USE_SUPABASE } from './config';
import * as mock from './profile.mock';
import * as supabase from './profile.supabase';

const impl = USE_SUPABASE ? supabase : mock;

export const getCurrentProfile = impl.getCurrentProfile;
export const getProfileById = impl.getProfileById;
export const updateTastePassport = impl.updateTastePassport;
export const upsertProfile = impl.upsertProfile;
export const completeTastePassport = impl.completeTastePassport;
export const getTastePersona = impl.getTastePersona;
