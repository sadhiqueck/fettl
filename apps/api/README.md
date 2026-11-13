# Running Fettl

Fettl uses React and Vite, a NestJS API, and PostgreSQL. Use Node 22.12 or later and pnpm 10. Run commands from the repository root.

## Local development

1. Copy `apps/api/.env.example` to `apps/api/.env`. Set a unique JWT signing secret and a 64-character hexadecimal VPA encryption key. Keep the encryption key stable across restarts. Set `RESEND_API_KEY` and a verified `EMAIL_FROM` for email sign-in, or configure Google OAuth credentials and callback. Image uploads require the S3-compatible bucket settings.
2. Run `docker compose up --build`. The development stack serves the app at `http://localhost:5173` and the API at `http://localhost:3000`. Compose runs versioned migrations before starting the API.
3. For native development, start PostgreSQL with `docker compose up -d postgres`, run `pnpm install --frozen-lockfile`, then `pnpm --filter @fettl/api exec prisma migrate deploy` and `pnpm dev`.

## Existing databases

For an installation originally created with `prisma db push`, back up PostgreSQL and verify that its schema matches the baseline migration before marking `20260812000000_baseline` applied with `prisma migrate resolve --applied 20260812000000_baseline`. Use the API workspace for Prisma commands. On an empty database, run migrate deploy directly. The following migrations reconstruct balances from recorded expenses and confirmed payments and grant access to existing receipt, chat, and avatar files. Schedule the balance migration during a quiet period because it locks ledger writes.

## Verification and release

Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`. Run `pnpm --filter @fettl/api test:e2e --runInBand` with an isolated migrated database and the required test environment variables. The integration test creates two temporary accounts and exercises the HTTP ledger.

Serve `apps/web/dist` with SPA fallback to index.html. Set `VITE_API_URL` before building. Run the API with `NODE_ENV=production`, HTTPS frontend and API URLs, and the configured secrets. Use `pnpm --filter @fettl/api start:prod` after migrations and build. WebSocket rooms currently run in one API process. Sign-in delivery, Google redirect URIs, private object storage, and optional push delivery need an acceptance check using the deployment's provider accounts.

## Auth environment checks

| Environment | Frontend and API | Google authorized redirect URI | Session cookies |
| --- | --- | --- | --- |
| Local development | `http://localhost:5173` and `http://localhost:3000` | `http://localhost:3000/auth/google/callback` | `HttpOnly`, `SameSite=Lax`; no `Secure` flag |
| HTTPS deployment | Public `FRONTEND_URL` and `API_URL` over HTTPS | Exactly `${API_URL}/auth/google/callback` | `HttpOnly`, `Secure`, `SameSite=None` |

`GOOGLE_CALLBACK_URL`, if set, must equal the public API callback URL. The API now rejects a mismatched callback at startup; the matching URI must also be registered in the Google OAuth client. `FRONTEND_URL` lists allowed frontend origins. Google sign-in returns to the origin that started it. `VITE_API_URL` must point to the same API origin that sets the OAuth state cookie and receives Google's callback. For local development, keep both the browser's API URL and callback on `localhost:3000`. A public HTTPS API accessed from a localhost frontend relies on third-party cookies, which browsers may block. Prefer a local API for local frontend testing and a stable same-site API hostname for the hosted app.

On each deployed environment, verify that `/auth/google` redirects to Google with the expected `redirect_uri`, the callback returns to the initiating frontend, and the browser retains both auth cookies after callback and refresh. Check `Set-Cookie` attributes in browser developer tools; the cookies are `HttpOnly` and cannot be read from JavaScript. Email links must open `/auth/confirm` without creating a session until **Continue to Fettl** is clicked. Existing emailed API links redirect to the same confirmation page without using their tokens.
