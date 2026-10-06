import { describe, expect, it } from 'vitest';
import {
  assertSafeDatabaseTarget,
  isProductionDatabaseHost,
  resolveAppEnvironment,
  shouldEnableBackgroundJobs,
} from '../server/env';

describe('deployment environment safety', () => {
  it('treats an unset app environment as production for backwards compatibility', () => {
    expect(resolveAppEnvironment()).toBe('production');
  });

  it('detects a guarded production database host without exposing connection data', () => {
    expect(isProductionDatabaseHost('postgres://user:pass@db-prod.example.net:5432/app', 'db-prod')).toBe(true);
    expect(isProductionDatabaseHost('postgres://user:pass@stage.example.net/app', 'db-prod')).toBe(false);
  });

  it('refuses a guarded production database from staging', () => {
    expect(() => assertSafeDatabaseTarget({
      APP_ENV: 'staging',
      DATABASE_URL: 'postgres://user:pass@db-prod.example.net/app',
      PROD_DB_HOST_GUARD: 'db-prod',
    })).toThrow(/matches PROD_DB_HOST_GUARD/);
  });

  it('requires a host guard when a non-production environment configures a database', () => {
    expect(() => assertSafeDatabaseTarget({
      APP_ENV: 'preview',
      DATABASE_URL: 'postgres://user:pass@stage.example.net/app',
    })).toThrow(/PROD_DB_HOST_GUARD is required/);
  });

  it('keeps background jobs on by default and validates explicit configuration', () => {
    expect(shouldEnableBackgroundJobs()).toBe(true);
    expect(shouldEnableBackgroundJobs('false')).toBe(false);
    expect(() => shouldEnableBackgroundJobs('sometimes')).toThrow(/ENABLE_BACKGROUND_JOBS/);
  });
});
