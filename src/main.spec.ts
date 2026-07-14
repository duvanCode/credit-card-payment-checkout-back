describe('main bootstrap', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('inicializa Nest app con pipes, filtros, interceptores, swagger, prisma y listen', async () => {
    process.env.PORT = '3101';

    const appMock = {
      getHttpAdapter: jest.fn(),
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
      useGlobalInterceptors: jest.fn(),
      enableCors: jest.fn(),
      use: jest.fn(),
      get: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    const prismaServiceMock = {
      enableShutdownHooks: jest.fn().mockResolvedValue(undefined),
    };
    const expressAppMock = {
      set: jest.fn(),
    };

    appMock.get.mockReturnValue(prismaServiceMock);
    appMock.getHttpAdapter.mockReturnValue({
      getInstance: jest.fn().mockReturnValue(expressAppMock),
    });

    const createMock = jest.fn().mockResolvedValue(appMock);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: {
        create: createMock,
      },
    }));

    const swaggerCreateDocumentMock = jest.fn(() => ({}));
    const swaggerSetupMock = jest.fn();
    const documentBuilderBuildMock = jest.fn(() => ({}));

    jest.doMock('@nestjs/swagger', () => ({
      ApiProperty: () => () => undefined,
      ApiPropertyOptional: () => () => undefined,
      ApiTags: () => () => undefined,
      DocumentBuilder: jest.fn().mockImplementation(() => ({
        setTitle() {
          return this;
        },
        setDescription() {
          return this;
        },
        setVersion() {
          return this;
        },
        build: documentBuilderBuildMock,
      })),
      SwaggerModule: {
        createDocument: swaggerCreateDocumentMock,
        setup: swaggerSetupMock,
      },
    }));

    const expressStaticMock = jest.fn(() => 'static-middleware');
    jest.doMock('express', () => ({
      __esModule: true,
      default: {
        static: expressStaticMock,
      },
    }));

    jest.doMock('./shared/database/prisma.service', () => ({
      PrismaService: class {},
    }));

    await jest.isolateModulesAsync(async () => {
      await import('./main');
    });

    expect(createMock).toHaveBeenCalledWith(expect.any(Function));
    expect(expressAppMock.set).toHaveBeenCalledWith('trust proxy', true);
    expect(appMock.useGlobalPipes).toHaveBeenCalledTimes(1);
    expect(appMock.useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(appMock.useGlobalInterceptors).toHaveBeenCalledTimes(1);
    expect(appMock.enableCors).toHaveBeenCalledTimes(1);
    expect(expressStaticMock).toHaveBeenCalledTimes(1);
    expect(appMock.use).toHaveBeenCalledWith('/imagenes', 'static-middleware');
    expect(documentBuilderBuildMock).toHaveBeenCalledTimes(1);
    expect(swaggerCreateDocumentMock).toHaveBeenCalledTimes(1);
    expect(swaggerSetupMock).toHaveBeenCalledWith('api', appMock, {});
    expect(prismaServiceMock.enableShutdownHooks).toHaveBeenCalledWith(appMock);
    expect(appMock.listen).toHaveBeenCalledWith('3101');
  });

  it('usa el puerto por defecto cuando PORT no esta definido', async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.PORT;

    const appMock = {
      getHttpAdapter: jest.fn(),
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
      useGlobalInterceptors: jest.fn(),
      enableCors: jest.fn(),
      use: jest.fn(),
      get: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    const prismaServiceMock = {
      enableShutdownHooks: jest.fn().mockResolvedValue(undefined),
    };
    const expressAppMock = {
      set: jest.fn(),
    };

    appMock.get.mockReturnValue(prismaServiceMock);
    appMock.getHttpAdapter.mockReturnValue({
      getInstance: jest.fn().mockReturnValue(expressAppMock),
    });

    const createMock = jest.fn().mockResolvedValue(appMock);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: {
        create: createMock,
      },
    }));

    jest.doMock('@nestjs/swagger', () => ({
      ApiProperty: () => () => undefined,
      ApiPropertyOptional: () => () => undefined,
      ApiTags: () => () => undefined,
      DocumentBuilder: jest.fn().mockImplementation(() => ({
        setTitle() {
          return this;
        },
        setDescription() {
          return this;
        },
        setVersion() {
          return this;
        },
        build: jest.fn(() => ({})),
      })),
      SwaggerModule: {
        createDocument: jest.fn(() => ({})),
        setup: jest.fn(),
      },
    }));

    jest.doMock('express', () => ({
      __esModule: true,
      default: {
        static: jest.fn(() => 'static-middleware'),
      },
    }));

    jest.doMock('./shared/database/prisma.service', () => ({
      PrismaService: class {},
    }));

    await jest.isolateModulesAsync(async () => {
      await import('./main');
    });

    const port = appMock.listen.mock.calls[0]?.[0];
    expect(String(port)).toBe('3000');
    process.env = originalEnv;
  });
});
