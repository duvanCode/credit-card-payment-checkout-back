import configuration from './configuration';

describe('configuration', () => {
  beforeEach(() => {
    delete process.env.TRANSACTION_SYNC_INTERVAL_SECONDS;
  });

  it('lee el intervalo del job desde env con fallback', () => {
    const config = configuration();
    expect(config.jobs.transactionSyncIntervalSeconds).toBe(30);
  });

  it('lee el intervalo del job desde env', () => {
    process.env.TRANSACTION_SYNC_INTERVAL_SECONDS = '12';
    const config = configuration();
    expect(config.jobs.transactionSyncIntervalSeconds).toBe(12);
  });
});

