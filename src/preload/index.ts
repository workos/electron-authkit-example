import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const authApi = {
  signIn: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('auth:sign-in'),

  signOut: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('auth:sign-out'),

  getUser: (): Promise<unknown> => ipcRenderer.invoke('auth:get-user'),

  onAuthChange: (callback: (data: { user: unknown }) => void): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { user: unknown }
    ): void => {
      callback(data)
    }
    ipcRenderer.on('auth:on-auth-change', listener)
    return () => ipcRenderer.removeListener('auth:on-auth-change', listener)
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('auth', authApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.auth = authApi
}
