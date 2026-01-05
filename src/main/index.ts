import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerProtocol, setupDeepLinkHandling } from './auth/deep-link-handler'
import { setupAuthIpcHandlers, notifyAuthChange } from './auth/ipc-handlers'
import { getAuthState } from './auth/auth-service'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

registerProtocol()

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  const mainWindow = createWindow()

  setupAuthIpcHandlers(mainWindow)
  setupDeepLinkHandling(mainWindow, async (success) => {
    if (success) {
      const auth = await getAuthState()
      notifyAuthChange(mainWindow, auth.user ?? null)
    }
  })

  try {
    const auth = await getAuthState()
    if (auth.user) {
      mainWindow.webContents.once('did-finish-load', () => {
        notifyAuthChange(mainWindow, auth.user)
      })
    }
  } catch (error) {
    console.error('Failed to get initial auth state:', error)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
