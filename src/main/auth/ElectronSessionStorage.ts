import Store from 'electron-store'
import type { SessionStorage, AuthKitConfig } from '@workos/authkit-session'
import type { ElectronRequest, ElectronResponse } from './types'

interface StoreSchema {
  session: string | null
}

export class ElectronSessionStorage
  implements SessionStorage<ElectronRequest, ElectronResponse>
{
  private store: Store<StoreSchema>

  constructor(config: AuthKitConfig) {
    this.store = new Store<StoreSchema>({
      name: 'authkit-session',
      encryptionKey: config.cookiePassword,
      defaults: {
        session: null,
      },
    })
  }

  async getSession(_request: ElectronRequest): Promise<string | null> {
    return this.store.get('session', null)
  }

  async saveSession(
    _response: ElectronResponse | undefined,
    sessionData: string
  ): Promise<{ response?: ElectronResponse }> {
    this.store.set('session', sessionData)
    return { response: { type: 'electron-response' } }
  }

  async clearSession(
    _response: ElectronResponse | undefined
  ): Promise<{ response?: ElectronResponse }> {
    this.store.delete('session')
    return { response: { type: 'electron-response' } }
  }
}
