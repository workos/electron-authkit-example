# Electron + WorkOS AuthKit

<img width="2024" height="1564" alt="capture_20260105_093742" src="https://github.com/user-attachments/assets/6610fb06-dd1b-4211-a3b5-2f1b60c94311" />

An example Electron app with WorkOS AuthKit authentication using the [`@workos-inc/node`](https://www.npmjs.com/package/@workos-inc/node) SDK with PKCE.

## Quick Start

```bash
git clone <repo-url>
cd electron-authkit-example
pnpm install
```

Create `.env`:

```bash
MAIN_VITE_WORKOS_CLIENT_ID=client_xxx
MAIN_VITE_WORKOS_ENCRYPTION_SECRET=<32+ character secret>
```

Add `workos-auth://callback` as a redirect URI in your [WorkOS Dashboard](https://dashboard.workos.com).

```bash
pnpm dev
```

## What This Demonstrates

Electron apps can't use traditional cookie-based auth flows. This example shows how to implement WorkOS AuthKit authentication using:

1. **PKCE (Proof Key for Code Exchange)** — Secure OAuth flow for public clients that can't safely store a client secret
2. **Deep link handling** — Registers `workos-auth://` protocol to receive OAuth callbacks from the system browser
3. **Encrypted session storage** — Uses `electron-store` with encryption for secure token persistence

## Architecture

```
Renderer (React)          Main Process
┌──────────────┐         ┌─────────────────────────┐
│  useAuth()   │──IPC───▶│  IPC Handlers           │
│  signIn()    │         │         │               │
│  signOut()   │◀─────── │         ▼               │
└──────────────┘         │  auth.ts                │
                         │  (@workos-inc/node)     │
                         │         │               │
                         │         ▼               │
                         │  electron-store         │
                         │  (encrypted)            │
                         └─────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| [`src/main/auth/auth.ts`](src/main/auth/auth.ts) | PKCE flow, token exchange, session storage, refresh logic |
| [`src/main/auth/deep-link-handler.ts`](src/main/auth/deep-link-handler.ts) | Registers `workos-auth://` protocol, handles OAuth callback |
| [`src/main/auth/ipc-handlers.ts`](src/main/auth/ipc-handlers.ts) | IPC handlers for sign-in, sign-out, get-user |
| [`src/preload/index.ts`](src/preload/index.ts) | Exposes `window.auth` API to renderer |
| [`src/renderer/src/hooks/useAuth.ts`](src/renderer/src/hooks/useAuth.ts) | React hook for auth state |

## How It Works

### PKCE Flow

[PKCE (Proof Key for Code Exchange)](https://oauth.net/2/pkce/) is required for Electron apps because they're "public clients"—the app binary can be decompiled, so a client secret can't be safely embedded.

1. **Sign-in initiated** — App generates a random `code_verifier` and derives a `code_challenge` (SHA256 hash)
2. **Authorization request** — User is sent to WorkOS with the `code_challenge`; the `code_verifier` is stored locally
3. **User authenticates** — WorkOS redirects to `workos-auth://callback?code=xxx`
4. **Token exchange** — App sends the `code` + original `code_verifier` to WorkOS
5. **Verification** — WorkOS hashes the `code_verifier` and confirms it matches the original `code_challenge`
6. **Tokens issued** — Access and refresh tokens are returned and stored encrypted

This ensures that even if an attacker intercepts the authorization code, they can't exchange it without the `code_verifier` that never left the app.

Token refresh is automatic when calling `getUser()`.

## Build

```bash
pnpm build:mac    # macOS
pnpm build:win    # Windows
pnpm build:linux  # Linux
```

## Learn More

- [`@workos-inc/node`](https://www.npmjs.com/package/@workos-inc/node) — WorkOS Node.js SDK
- [WorkOS AuthKit Docs](https://workos.com/docs/user-management) — User management documentation
- [PKCE (RFC 7636)](https://oauth.net/2/pkce/) — Proof Key for Code Exchange specification
- [Electron Deep Links](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app) — Protocol handling in Electron
