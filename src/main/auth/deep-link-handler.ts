import { app, BrowserWindow } from 'electron'
import path from 'path'
import { authService } from './auth-service'
import type { ElectronRequest, ElectronResponse } from './types'

const PROTOCOL = 'workos-auth'

export function registerProtocol(): void {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ])
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }
}

export function setupDeepLinkHandling(
  mainWindow: BrowserWindow,
  onAuthComplete: (success: boolean) => void
): void {
  const handleUrl = async (url: string): Promise<void> => {
    const params = new URL(url).searchParams
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      console.error('OAuth error:', error, params.get('error_description'))
      onAuthComplete(false)
      return
    }

    if (!code) {
      console.error('No authorization code in callback')
      onAuthComplete(false)
      return
    }

    try {
      const request: ElectronRequest = { type: 'electron-request' }
      const response: ElectronResponse = { type: 'electron-response' }

      await authService.handleCallback(request, response, {
        code,
        state: params.get('state') ?? undefined,
      })

      onAuthComplete(true)
    } catch (err) {
      console.error('Auth callback failed:', err)
      onAuthComplete(false)
    }
  }

  app.on('open-url', (event, url) => {
    event.preventDefault()
    if (url.startsWith(`${PROTOCOL}://`)) {
      handleUrl(url)
    }
  })

  app.on('second-instance', (_event, argv) => {
    const url = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    if (url) {
      handleUrl(url)
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  })
}
