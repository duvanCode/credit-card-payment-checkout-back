import { validateLuhn } from './luhn.util';

describe('validateLuhn', () => {
  it('valida un numero correcto', () => {
    expect(validateLuhn('4242424242424242')).toBe(true);
  });

  it('rechaza un numero invalido', () => {
    expect(validateLuhn('4242424242424241')).toBe(false);
  });
});
