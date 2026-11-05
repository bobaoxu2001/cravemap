import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeVerifiedRevenue } from '../src/services/studio/revenuePolicy.ts';

const payment = { amountCents: 4900, currency: 'USD', paymentStatus: 'succeeded', verifiedAt: '2026-11-01T00:00:00Z' };
test('self-reported and legacy unverified successes do not count as revenue', () => {
  const rows = [payment, { ...payment, verifiedAt: null }, { ...payment, paymentStatus: 'pending' }, { ...payment, paymentStatus: 'refunded' }];
  assert.deepEqual(summarizeVerifiedRevenue(rows), { totalCents: 4900, succeededCount: 1, currency: 'USD' });
});
test('keeps currencies separate and rejects malformed verification or amounts', () => {
  const rows = [payment, { ...payment, currency: 'EUR' }, { ...payment, amountCents: -1 }, { ...payment, amountCents: NaN }, { ...payment, verifiedAt: 'unverified' }];
  assert.equal(summarizeVerifiedRevenue(rows).totalCents, 4900);
  assert.deepEqual(summarizeVerifiedRevenue(rows, 'EUR'), { totalCents: 4900, succeededCount: 1, currency: 'EUR' });
});
