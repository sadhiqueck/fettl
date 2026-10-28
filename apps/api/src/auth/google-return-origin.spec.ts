import {
  createGoogleState,
  originFromGoogleState,
  selectFrontendOrigin,
} from './google-return-origin';

const frontends = 'https://app.example.test,http://localhost:5173';

describe('Google sign-in return origin', () => {
  it('returns to the allowed frontend that started sign-in', () => {
    const origin = selectFrontendOrigin(frontends, 'http://localhost:5173');
    const state = createGoogleState(origin);
    expect(originFromGoogleState(frontends, state)).toBe(
      'http://localhost:5173',
    );
  });

  it('uses the primary frontend when no origin was requested', () => {
    expect(selectFrontendOrigin(frontends)).toBe('https://app.example.test');
  });

  it('rejects untrusted destinations and malformed callback state', () => {
    expect(() =>
      selectFrontendOrigin(frontends, 'https://evil.example'),
    ).toThrow();
    expect(() =>
      selectFrontendOrigin(frontends, 'http://localhost:5173/next'),
    ).toThrow();
    expect(() =>
      selectFrontendOrigin(frontends, ['http://localhost:5173']),
    ).toThrow();
    expect(() => originFromGoogleState(frontends, 'invalid')).toThrow();
    expect(() =>
      originFromGoogleState(
        frontends,
        createGoogleState('https://evil.example'),
      ),
    ).toThrow();
  });
});
