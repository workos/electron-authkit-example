import type { User } from '@workos/authkit-session'

export type ElectronRequest = { type: 'electron-request' }
export type ElectronResponse = { type: 'electron-response' }

export const AUTH_CHANNELS = {
  SIGN_IN: 'auth:sign-in',
  SIGN_OUT: 'auth:sign-out',
  GET_USER: 'auth:get-user',
  ON_AUTH_CHANGE: 'auth:on-auth-change',
} as const

export interface AuthIpcResult {
  success: boolean
  error?: string
}

export interface AuthChangePayload {
  user: User | null
}
