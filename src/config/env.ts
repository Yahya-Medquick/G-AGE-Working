export type AppEnvironment = 'production' | 'staging' | 'preview';

export function resolveAppEnvironment(value?: string): AppEnvironment {
  if (!value) return 'production';
  if (value === 'production' || value === 'staging' || value === 'preview') return value;
  throw new Error(`Unsupported app environment: ${value}`);
}

export const appEnvironment = resolveAppEnvironment(import.meta.env.VITE_APP_ENV);
export const isNonProduction = appEnvironment !== 'production';
