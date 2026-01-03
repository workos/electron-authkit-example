import { ipcMain, shell, BrowserWindow } from 'electron'
import { authService, getAuthState } from './auth-service'
import {
  AUTH_CHANNELS,
  type AuthIpcResult,
  type AuthChangePayload,
  type ElectronResponse,
} from './types'

export function setupAuthIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(AUTH_CHANNELS.SIGN_IN, async (): Promise<AuthIpcResult> => {
    try {
      const url = await authService.getSignInUrl()
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      console.error('Sign in failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(AUTH_CHANNELS.SIGN_OUT, async (): Promise<AuthIpcResult> => {
    try {
      const response: ElectronResponse = { type: 'electron-response' }
      await authService.clearSession(response)
      notifyAuthChange(mainWindow, null)
      return { success: true }
    } catch (error) {
      console.error('Sign out failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(AUTH_CHANNELS.GET_USER, async () => {
    try {
      const auth = await getAuthState()
      return auth.user ?? null
    } catch (error) {
      console.error('Get user failed:', error)
      return null
    }
  })
}

export function notifyAuthChange(
  mainWindow: BrowserWindow,
  user: AuthChangePayload['user']
): void {
  const payload: AuthChangePayload = { user }
  mainWindow.webContents.send(AUTH_CHANNELS.ON_AUTH_CHANGE, payload)
}
