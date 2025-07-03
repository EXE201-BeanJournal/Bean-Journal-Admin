/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_EMAIL_SERVICE_URL: string
  readonly VITE_EMAIL_SERVICE_KEY: string
  readonly VITE_EMAIL_FROM_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}