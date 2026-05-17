// src/services/invites.ts
import { USE_SUPABASE } from './config';
import * as mock from './invites.mock';
// TODO(supabase commit 3+): import * as supabase from './invites.supabase';

const impl = USE_SUPABASE ? mock : mock; // swap to supabase in future commit

export const createInvite = impl.createInvite;
export const getInviteStats = impl.getInviteStats;
export const getMyInvites = impl.getMyInvites;
