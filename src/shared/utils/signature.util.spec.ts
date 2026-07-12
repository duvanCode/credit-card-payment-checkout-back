import { generateSignature } from './signature.util';

describe('generateSignature', () => {
  it('genera una firma SHA-256 deterministica', () => {
    expect(
      generateSignature(
        'TRX-123',
        150000,
        'COP',
        'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp',
      ),
    ).toBe('a9870dbfe771539fdc6f1de9ee72d93774288ba3937221b10514fa8288e15fdb');
  });
});
