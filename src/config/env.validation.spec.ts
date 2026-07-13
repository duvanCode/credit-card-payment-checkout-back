import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  it('aplica defaults y valida valores obligatorios', () => {
    const result = envValidationSchema.validate(
      {
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/db?schema=public',
        PAYMENT_GATEWAY_SANDBOX_URL: 'https://sandbox.example.com',
        PAYMENT_GATEWAY_PUBLIC_KEY: 'pub',
        PAYMENT_GATEWAY_PRIVATE_KEY: 'prv',
        PAYMENT_GATEWAY_INTEGRITY_KEY: 'integrity',
      },
      { abortEarly: false },
    );

    expect(result.error).toBeUndefined();
    expect(result.value.PORT).toBe(3000);
    expect(result.value.NODE_ENV).toBe('development');
    expect(result.value.TRANSACTION_SYNC_INTERVAL_SECONDS).toBe(30);
  });

  it('rechaza intervalos menores al minimo', () => {
    const result = envValidationSchema.validate(
      {
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/db?schema=public',
        PAYMENT_GATEWAY_SANDBOX_URL: 'https://sandbox.example.com',
        PAYMENT_GATEWAY_PUBLIC_KEY: 'pub',
        PAYMENT_GATEWAY_PRIVATE_KEY: 'prv',
        PAYMENT_GATEWAY_INTEGRITY_KEY: 'integrity',
        TRANSACTION_SYNC_INTERVAL_SECONDS: 1,
      },
      { abortEarly: false },
    );

    expect(result.error).toBeDefined();
  });
});

