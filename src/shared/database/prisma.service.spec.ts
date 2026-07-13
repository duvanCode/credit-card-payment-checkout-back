describe('PrismaService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('conecta en onModuleInit', async () => {
    const connectMock = jest.fn().mockResolvedValue(undefined);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: class {
        $connect = connectMock;
      },
    }));

    const { PrismaService } = await import('./prisma.service');

    const service = new PrismaService();
    await service.onModuleInit();

    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('registra beforeExit para cerrar la app', async () => {
    const closeMock = jest.fn().mockResolvedValue(undefined);
    const onSpy = jest.spyOn(process, 'on').mockImplementation((event, listener) => {
      if (event === 'beforeExit') {
        void (listener as () => Promise<void>)();
      }
      return process;
    });

    jest.doMock('@prisma/client', () => ({
      PrismaClient: class {
        $connect = jest.fn().mockResolvedValue(undefined);
      },
    }));

    const { PrismaService } = await import('./prisma.service');

    const service = new PrismaService();
    await service.enableShutdownHooks({ close: closeMock } as never);

    expect(onSpy).toHaveBeenCalledWith('beforeExit', expect.any(Function));
    expect(closeMock).toHaveBeenCalledTimes(1);

    onSpy.mockRestore();
  });
});

