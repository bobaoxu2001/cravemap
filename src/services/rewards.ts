// src/services/rewards.ts
import { USE_SUPABASE } from './config';
import * as mock from './rewards.mock';
// TODO(supabase commit 3+): import * as supabase from './rewards.supabase';

const impl = USE_SUPABASE ? mock : mock; // swap to supabase in future commit

export const getFoundingScoutProgress = impl.getFoundingScoutProgress;
export const calculateProgress = impl.calculateProgress;
export const getRewardTasks = impl.getRewardTasks;
