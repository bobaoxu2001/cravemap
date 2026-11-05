export interface RevenuePayment {
  amountCents: number;
  currency: string;
  paymentStatus: string;
  verifiedAt: string | null;
}

/** Self-reports and amounts in another currency cannot inflate verified revenue. */
export function summarizeVerifiedRevenue(payments: RevenuePayment[], currency = 'USD') {
  const verified = payments.filter((payment) =>
    payment.paymentStatus === 'succeeded' &&
    Boolean(payment.verifiedAt && Number.isFinite(Date.parse(payment.verifiedAt))) &&
    payment.currency.toUpperCase() === currency.toUpperCase() &&
    Number.isSafeInteger(payment.amountCents) && payment.amountCents > 0
  );
  return {
    totalCents: verified.reduce((total, payment) => total + payment.amountCents, 0),
    succeededCount: verified.length,
    currency: currency.toUpperCase(),
  };
}
