/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly MAIN_VITE_WORKOS_CLIENT_ID: string
  readonly MAIN_VITE_WORKOS_ENCRYPTION_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
