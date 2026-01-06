import { ElectronAPI } from '@electron-toolkit/preload'
import type { User } from '@workos-inc/node'

interface AuthApi {
  signIn(): Promise<{ success: boolean; error?: string }>
  signOut(): Promise<{ success: boolean; error?: string }>
  getUser(): Promise<User | null>
  onAuthChange(callback: (data: { user: User | null }) => void): () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    auth: AuthApi
  }
}
