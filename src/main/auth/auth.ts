import { WorkOS } from '@workos-inc/node'
import Store from 'electron-store'
import type { User } from '@workos-inc/node'

const CLIENT_ID = import.meta.env.MAIN_VITE_WORKOS_CLIENT_ID
const REDIRECT_URI = 'workos-auth://callback'
const PKCE_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface StoreSchema {
  session: { accessToken: string; refreshToken: string; user: User } | null
  pkce: { codeVerifier: string; expiresAt: number } | null
}

const workos = new WorkOS({ clientId: CLIENT_ID })
const store = new Store<StoreSchema>({
  name: 'authkit-session',
  encryptionKey: import.meta.env.MAIN_VITE_WORKOS_COOKIE_PASSWORD,
  defaults: { session: null, pkce: null }
})

/** Generate sign-in URL with PKCE challenge */
export async function getSignInUrl(): Promise<string> {
  const { codeVerifier, codeChallenge } = await workos.pkce.generate()
  store.set('pkce', { codeVerifier, expiresAt: Date.now() + PKCE_TTL_MS })

  return workos.userManagement.getAuthorizationUrl({
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    codeChallenge,
    codeChallengeMethod: 'S256',
    provider: 'authkit'
  })
}

/** Exchange authorization code for tokens */
export async function handleCallback(code: string): Promise<User> {
  const pkce = store.get('pkce')
  if (!pkce) throw new Error('No PKCE state found')
  if (pkce.expiresAt < Date.now()) {
    store.delete('pkce')
    throw new Error('PKCE expired')
  }

  const auth = await workos.userManagement.authenticateWithCode({
    clientId: CLIENT_ID,
    code,
    codeVerifier: pkce.codeVerifier
  })

  store.delete('pkce')
  store.set('session', {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user
  })

  return auth.user
}

/** Get current user, refreshing token if expired */
export async function getUser(): Promise<User | null> {
  const session = store.get('session')
  if (!session?.accessToken) return null

  // Check if token expired (with 10s buffer)
  const exp = JSON.parse(Buffer.from(session.accessToken.split('.')[1], 'base64').toString()).exp
  if (Date.now() > exp * 1000 - 10000) {
    try {
      const refreshed = await workos.userManagement.authenticateWithRefreshToken({
        clientId: CLIENT_ID,
        refreshToken: session.refreshToken
      })
      store.set('session', {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        user: refreshed.user
      })
      return refreshed.user
    } catch {
      store.delete('session')
      return null
    }
  }

  return session.user
}

/** Clear local session */
export function clearSession(): void {
  store.delete('session')
  store.delete('pkce')
}

/** Get session ID from stored access token */
export function getSessionId(): string | null {
  const session = store.get('session')
  if (!session?.accessToken) return null
  try {
    const payload = JSON.parse(Buffer.from(session.accessToken.split('.')[1], 'base64').toString())
    return payload.sid ?? null
  } catch {
    return null
  }
}

/** Get logout URL */
export function getLogoutUrl(sessionId: string): string {
  return `https://api.workos.com/user_management/sessions/logout?session_id=${sessionId}`
}
