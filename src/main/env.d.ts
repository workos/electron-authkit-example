/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly MAIN_VITE_WORKOS_CLIENT_ID: string
  readonly MAIN_VITE_WORKOS_API_KEY: string
  readonly MAIN_VITE_WORKOS_COOKIE_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
