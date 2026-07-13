import { of } from 'rxjs';
import { ResponseFormatInterceptor } from './response-format.interceptor';

describe('ResponseFormatInterceptor', () => {
  it('envuelve la respuesta con success/data', (done) => {
    const interceptor = new ResponseFormatInterceptor();
    const next = {
      handle: () => of({ hello: 'world' }),
    };

    interceptor.intercept({} as never, next as never).subscribe({
      next: (value) => {
        expect(value).toEqual({ success: true, data: { hello: 'world' } });
        done();
      },
      error: done,
    });
  });
});

