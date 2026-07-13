export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  paymentGateway: {
    sandboxUrl: process.env.PAYMENT_GATEWAY_SANDBOX_URL ?? '',
    publicKey: process.env.PAYMENT_GATEWAY_PUBLIC_KEY ?? '',
    privateKey: process.env.PAYMENT_GATEWAY_PRIVATE_KEY ?? '',
    eventsKey: process.env.PAYMENT_GATEWAY_EVENTS_KEY ?? '',
    integrityKey: process.env.PAYMENT_GATEWAY_INTEGRITY_KEY ?? '',
  },
  jobs: {
    transactionSyncIntervalSeconds: parseInt(
      process.env.TRANSACTION_SYNC_INTERVAL_SECONDS ?? '30',
      10,
    ),
  },
});
