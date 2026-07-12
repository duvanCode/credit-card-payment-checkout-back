import { createHash } from 'crypto';

export function generateSignature(
  reference: string,
  amount: number,
  currency: string,
  integrityKey: string,
): string {
  return createHash('sha256')
    .update(`${reference}${amount}${currency}${integrityKey}`)
    .digest('hex');
}
