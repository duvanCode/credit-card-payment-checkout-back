import { getPublicBaseUrl, getPublicImageUrl } from './public-url.util';

describe('public-url.util', () => {
  it('arma la base url usando host y protocol directos', () => {
    const result = getPublicBaseUrl({
      protocol: 'https',
      get: jest.fn((name: string) => {
        if (name === 'host') {
          return 'payment.ondeploy.online';
        }

        return undefined;
      }),
    });

    expect(result).toBe('https://payment.ondeploy.online');
  });

  it('prioriza headers x-forwarded cuando existen', () => {
    const result = getPublicBaseUrl({
      protocol: 'http',
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'api.example.com',
        host: 'internal:3210',
      },
    });

    expect(result).toBe('https://api.example.com');
  });

  it('genera la url publica de imagen cuando en base solo hay nombre de archivo', () => {
    const result = getPublicImageUrl('laptop_pro_15.png', {
      protocol: 'https',
      headers: {
        host: 'payment.ondeploy.online',
      },
    });

    expect(result).toBe(
      'https://payment.ondeploy.online/imagenes/laptop_pro_15.png',
    );
  });

  it('respeta urls absolutas existentes para compatibilidad', () => {
    const result = getPublicImageUrl('http://legacy-host/imagenes/demo.png', {
      protocol: 'https',
      headers: {
        host: 'payment.ondeploy.online',
      },
    });

    expect(result).toBe('http://legacy-host/imagenes/demo.png');
  });
});
