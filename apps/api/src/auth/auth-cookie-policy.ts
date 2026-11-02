export function secureAuthCookies(nodeEnv?: string, publicApiUrl?: string) {
  return (
    nodeEnv === 'production' || publicApiUrl?.startsWith('https://') === true
  );
}
