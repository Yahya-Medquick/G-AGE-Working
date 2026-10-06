import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRegisteredRoutes } from '../scripts/route-contract.mjs';

type Route = { method: string; path: string };

const baseline = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/route-baseline.json'), 'utf8'),
) as Route[];

describe('route contract', () => {
  it('keeps every baseline method and path registration', () => {
    const current = new Set(getRegisteredRoutes().map(({ method, path }) => `${method} ${path}`));
    const missing = baseline
      .map(({ method, path }) => `${method} ${path}`)
      .filter((route) => !current.has(route));
    expect(missing).toEqual([]);
  });
});
