import { of } from 'rxjs';
import { Logger } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('loggea metodo y ruta al finalizar', (done) => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    const interceptor = new LoggingInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/products' }),
      }),
    };
    const next = {
      handle: () => of({ ok: true }),
    };

    interceptor.intercept(context as never, next as never).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringMatching(/^GET \/products - \d+ms$/),
        );
        logSpy.mockRestore();
        done();
      },
      error: (err) => {
        logSpy.mockRestore();
        done(err);
      },
    });
  });
});

