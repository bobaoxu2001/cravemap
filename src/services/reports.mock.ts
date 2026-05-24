export type ReportReason =
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'misinformation'
  | 'other';

// In-process set so we don't "re-report" in a single session.
const reported = new Set<string>();

export async function reportCheckIn(
  checkInId: string,
  reason: ReportReason,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _details?: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  reported.add(`${checkInId}:${reason}`);
}

export async function hasReported(checkInId: string): Promise<boolean> {
  return [...reported].some((k) => k.startsWith(`${checkInId}:`));
}
