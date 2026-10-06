export type AppEnvironment = 'production' | 'staging' | 'preview';

export function resolveAppEnvironment(value?: string): AppEnvironment {
  if (!value) return 'production';
  if (value === 'production' || value === 'staging' || value === 'preview') return value;
  throw new Error(`Unsupported app environment: ${value}`);
}

export function isProductionDatabaseHost(connectionString?: string, hostGuard?: string): boolean {
  if (!connectionString || !hostGuard?.trim()) return false;
  let databaseHost: string;
  try {
    databaseHost = new URL(connectionString).hostname;
  } catch {
    throw new Error('Database URL is invalid; refusing to start outside production.');
  }
  return databaseHost.toLowerCase().includes(hostGuard.trim().toLowerCase());
}

export function assertSafeDatabaseTarget(env: NodeJS.ProcessEnv): void {
  const appEnv = resolveAppEnvironment(env.APP_ENV);
  if (appEnv === 'production') return;

  const connectionString = env.DATABASE_URL || env.POSTGRES_URL;
  if (!connectionString) return;
  const hostGuard = env.PROD_DB_HOST_GUARD?.trim();
  if (!hostGuard) {
    throw new Error('PROD_DB_HOST_GUARD is required when a non-production app uses a database.');
  }
  if (isProductionDatabaseHost(connectionString, hostGuard)) {
    throw new Error('The configured database host matches PROD_DB_HOST_GUARD; refusing to start.');
  }
}

export function shouldEnableBackgroundJobs(value?: string): boolean {
  if (value === undefined) return true;
  if (value.trim().toLowerCase() === 'true') return true;
  if (value.trim().toLowerCase() === 'false') return false;
  throw new Error('ENABLE_BACKGROUND_JOBS must be either "true" or "false".');
}
