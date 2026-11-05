import { getSupabaseClient } from '../lib/supabase';
import type { ReportReason } from './reports.mock';

export type { ReportReason };

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');
  return client;
}

export async function reportCheckIn(
  checkInId: string,
  reason: ReportReason,
  details?: string
): Promise<void> {
  const client = requireClient();
  const { data, error } = await client.rpc('report_check_in', {
    p_check_in_id: checkInId,
    p_reason: reason,
    p_details: details ?? null,
  });
  if (error) {
    throw new Error(error.message || 'Could not submit report.');
  }
  const result = data as { success: boolean; error?: string } | null;
  if (result && !result.success) {
    throw new Error(result.error ?? 'Could not submit report.');
  }
}
