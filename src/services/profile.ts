// src/services/profile.ts
import { USE_SUPABASE } from './config';
import * as mock from './profile.mock';
// TODO(supabase commit 3+): import * as supabase from './profile.supabase';

const impl = USE_SUPABASE ? mock : mock; // swap to supabase in future commit

export const getCurrentProfile = impl.getCurrentProfile;
export const updateTastePassport = impl.updateTastePassport;
export const getTastePersona = impl.getTastePersona;
