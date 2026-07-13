import { validateLuhn } from './luhn.util';

describe('validateLuhn', () => {
  it('rechaza inputs invalidos', () => {
    expect(validateLuhn('abcd')).toBe(false);
    expect(validateLuhn('123')).toBe(false);
  });

  it('valida un numero correcto', () => {
    expect(validateLuhn('4012 8888 8888 1881')).toBe(true);
  });

  it('rechaza un numero incorrecto', () => {
    expect(validateLuhn('4242 4242 4242 4243')).toBe(false);
  });
});
