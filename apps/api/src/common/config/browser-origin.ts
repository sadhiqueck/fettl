export function trustedBrowserOrigin(origin?: string) {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  return (
    origin === new URL(frontend).origin ||
    Boolean(
      process.env.API_URL && origin === new URL(process.env.API_URL).origin,
    )
  );
}
