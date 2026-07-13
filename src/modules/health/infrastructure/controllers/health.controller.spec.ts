import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('retorna ok con timestamp', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const controller = new HealthController();
    const result = controller.getHealth();

    expect(result).toEqual({
      status: 'ok',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    jest.useRealTimers();
  });
});

