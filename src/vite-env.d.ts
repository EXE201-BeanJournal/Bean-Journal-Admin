/// <reference types="vite/client" />
/// <reference types="node" />

// Type definitions for process.env (defined by Vite)
declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_EMAIL_SERVICE_URL: string;
    readonly VITE_EMAIL_SERVICE_KEY: string;
    readonly VITE_EMAIL_FROM_ADDRESS: string;
    readonly EMAIL_SERVICE_URL?: string;
    readonly EMAIL_SERVICE_KEY?: string;
    // Add other environment variables as needed
    [key: string]: string | undefined;
  }
}

// Ensure window is available in TypeScript
declare const window: Window & typeof globalThis;