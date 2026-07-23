/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL_BASE: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_LOGO_URL?: string;
  readonly VITE_WHATSAPP_URL_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
