/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_SUPPORT_NUMBER?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
