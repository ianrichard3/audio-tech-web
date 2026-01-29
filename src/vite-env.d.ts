/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_CLERK_JWT_TEMPLATE?: string
  readonly VITE_CLERK_AUDIENCE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
