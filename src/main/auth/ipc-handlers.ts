import { ipcMain, shell, BrowserWindow } from 'electron'
import { getSignInUrl, getUser, clearSession, getLogoutUrl, getSessionId } from './auth'
import { AUTH_CHANNELS, type AuthIpcResult, type AuthChangePayload } from './types'

export function setupAuthIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(AUTH_CHANNELS.SIGN_IN, async (): Promise<AuthIpcResult> => {
    try {
      const url = await getSignInUrl()
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      console.error('Sign in failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(AUTH_CHANNELS.SIGN_OUT, async (): Promise<AuthIpcResult> => {
    try {
      const sessionId = getSessionId()
      if (sessionId) {
        await shell.openExternal(getLogoutUrl(sessionId))
      }
      clearSession()
      notifyAuthChange(mainWindow, null)
      return { success: true }
    } catch (error) {
      console.error('Sign out failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(AUTH_CHANNELS.GET_USER, async () => {
    try {
      return await getUser()
    } catch (error) {
      console.error('Get user failed:', error)
      return null
    }
  })
}

export function notifyAuthChange(mainWindow: BrowserWindow, user: AuthChangePayload['user']): void {
  mainWindow.webContents.send(AUTH_CHANNELS.ON_AUTH_CHANGE, { user })
}
