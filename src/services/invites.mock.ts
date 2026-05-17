import type { Invite, InviteStats } from './types';

export function createInvite(inviteeEmail?: string): Promise<Invite> {
  const code = `CRAVE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const invite: Invite = {
    id: `inv_${Date.now()}`,
    code,
    inviteeEmail,
    createdAt: new Date().toISOString(),
  };
  return Promise.resolve(invite);
}

export function getInviteStats(_userId: string): Promise<InviteStats> {
  return Promise.resolve({ totalInvites: 0, acceptedInvites: 0 });
}

export function getMyInvites(_userId: string): Promise<Invite[]> {
  return Promise.resolve([]);
}
