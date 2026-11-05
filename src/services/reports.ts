import { USE_SUPABASE } from './config';
import * as mock from './reports.mock';
import * as supabase from './reports.supabase';

export type { ReportReason } from './reports.mock';

/**
 * Submit a content report for a check-in.
 * Idempotent: duplicate (reporter, check-in, reason) rows are ignored silently.
 * Rejects on network/auth failure; caller should surface a friendly error.
 */
export function reportCheckIn(
  checkInId: string,
  reason: mock.ReportReason,
  details?: string
): Promise<void> {
  if (!USE_SUPABASE) {
    return mock.reportCheckIn(checkInId, reason, details);
  }
  return supabase.reportCheckIn(checkInId, reason, details);
}
