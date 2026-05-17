// src/services/auth.ts
import { USE_SUPABASE } from './config';
import * as mock from './auth.mock';
// TODO(supabase commit 3+): import * as supabase from './auth.supabase';

const impl = USE_SUPABASE ? mock : mock; // swap to supabase in future commit

export const getCurrentSession = impl.getCurrentSession;
export const getCurrentUser = impl.getCurrentUser;
export const signIn = impl.signIn;
export const signUp = impl.signUp;
export const signOut = impl.signOut;
