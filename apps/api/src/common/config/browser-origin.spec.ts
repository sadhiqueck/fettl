import { parseFrontendOrigins } from './browser-origin';

describe('frontend origin configuration', () => {
  it('keeps the redirect destination first and local development as a separate origin', () => {
    const [destination, development] = parseFrontendOrigins(
      'https://app.example.test, http://localhost:5173/',
    );
    expect(`${destination}/dashboard`).toBe(
      'https://app.example.test/dashboard',
    );
    expect(development).toBe('http://localhost:5173');
  });

  it('rejects an origin with a missing protocol colon', () => {
    expect(() =>
      parseFrontendOrigins('https://app.example.test,http//localhost:5173'),
    ).toThrow();
  });
});
