// In-process block list — resets on app reload (mock mode).
const blockedIds = new Set<string>();

export async function blockUser(blockedUserId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  blockedIds.add(blockedUserId);
}

export async function getBlockedUserIds(): Promise<string[]> {
  return [...blockedIds];
}

export async function isBlocked(userId: string): Promise<boolean> {
  return blockedIds.has(userId);
}
