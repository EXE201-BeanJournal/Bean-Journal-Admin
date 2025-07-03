/// <reference types="vite/client" />
/// <reference types="node" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_EMAIL_SERVICE_URL: string;
  readonly VITE_EMAIL_SERVICE_KEY: string;
  readonly VITE_EMAIL_FROM_ADDRESS: string;
  // Add other environment variables as needed
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ensure window is available in TypeScript
declare const window: Window & typeof globalThis;