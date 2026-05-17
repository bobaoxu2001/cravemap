// src/services/storage.ts
import { USE_SUPABASE } from './config';
import * as mock from './storage.mock';
// TODO(supabase commit 3+): import * as supabase from './storage.supabase';

const impl = USE_SUPABASE ? mock : mock; // swap to supabase in future commit

export const uploadAvatar = impl.uploadAvatar;
export const uploadCheckInPhoto = impl.uploadCheckInPhoto;
