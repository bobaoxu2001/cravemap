// src/services/auth.ts
import { USE_SUPABASE } from './config';
import * as mock from './auth.mock';
import * as supabase from './auth.supabase';

const impl = USE_SUPABASE ? supabase : mock;

export const getSession = impl.getSession;
export const getCurrentSession = impl.getSession;
export const getCurrentUser = impl.getCurrentUser;
export const signIn = impl.signIn;
export const signUp = impl.signUp;
export const signOut = impl.signOut;
export const onAuthStateChange = impl.onAuthStateChange;
