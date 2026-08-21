export function parseFrontendOrigins(value: string): string[] {
  return value.split(',').map((entry) => {
    const url = new URL(entry.trim());
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.hostname.includes(',') ||
      url.pathname !== '/' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error('FRONTEND_URL must contain HTTP(S) origins');
    }
    return url.origin;
  });
}

export function trustedBrowserOrigin(origin?: string) {
  const frontends = parseFrontendOrigins(
    process.env.FRONTEND_URL || 'http://localhost:5173',
  );
  return (
    (origin !== undefined && frontends.includes(origin)) ||
    Boolean(
      process.env.API_URL && origin === new URL(process.env.API_URL).origin,
    )
  );
}
