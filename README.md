# Electron + WorkOS AuthKit

<img width="2024" height="1564" alt="capture_20260105_093742" src="https://github.com/user-attachments/assets/6610fb06-dd1b-4211-a3b5-2f1b60c94311" />

An example Electron app with WorkOS AuthKit authentication using [`@workos/authkit-session`](https://www.npmjs.com/package/@workos/authkit-session).

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

Electron doesn't have HTTP cookies. This example shows how to use `@workos/authkit-session` (the framework-agnostic core that powers [`@workos/authkit-tanstack-react-start`](https://www.npmjs.com/package/@workos/authkit-tanstack-react-start)) with a custom storage adapter.

Two key Electron-specific pieces:

1. **Session storage adapter** — Implements `SessionStorage` interface using `electron-store` for encrypted persistence
2. **Deep link handling** — Registers `workos-auth://` protocol to receive OAuth callbacks

## Architecture

```
Renderer (React)          Main Process
┌──────────────┐         ┌─────────────────────────┐
│  useAuth()   │──IPC───▶│  IPC Handlers           │
│  signIn()    │         │         │               │
│  signOut()   │◀─────── │         ▼               │
└──────────────┘         │  AuthService            │
                         │  (authkit-session)      │
                         │         │               │
                         │         ▼               │
                         │  ElectronSessionStorage │
                         │  (electron-store)       │
                         └─────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| [`src/main/auth/ElectronSessionStorage.ts`](src/main/auth/ElectronSessionStorage.ts) | `SessionStorage` implementation using `electron-store` |
| [`src/main/auth/auth-service.ts`](src/main/auth/auth-service.ts) | Configures `authkit-session` with the adapter |
| [`src/main/auth/deep-link-handler.ts`](src/main/auth/deep-link-handler.ts) | Registers `workos-auth://` protocol, handles OAuth callback |
| [`src/main/auth/ipc-handlers.ts`](src/main/auth/ipc-handlers.ts) | IPC handlers for sign-in, sign-out, get-user |
| [`src/preload/index.ts`](src/preload/index.ts) | Exposes `window.auth` API to renderer |
| [`src/renderer/src/hooks/useAuth.ts`](src/renderer/src/hooks/useAuth.ts) | React hook for auth state |

## How It Works

1. User clicks "Sign In" → main process opens WorkOS auth page in system browser
2. User authenticates → WorkOS redirects to `workos-auth://callback?code=xxx`
3. OS routes the URL to your app → `open-url` event fires
4. Main process exchanges code for tokens via `authService.handleCallback()`
5. Session saved to encrypted store → renderer notified via IPC

Token refresh is automatic when calling `getAuthState()`.

## Build

```bash
pnpm build:mac    # macOS
pnpm build:win    # Windows
pnpm build:linux  # Linux
```

## Learn More

- [`@workos/authkit-session`](https://www.npmjs.com/package/@workos/authkit-session) — The framework-agnostic session library
- [WorkOS AuthKit Docs](https://workos.com/docs/user-management) — User management documentation
- [Electron Deep Links](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app) — Protocol handling in Electron
