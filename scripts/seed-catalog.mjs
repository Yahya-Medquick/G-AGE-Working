import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const appEnv = (process.env.APP_ENV || '').toLowerCase();
const seedPath = 'data/catalog.seed.json';

function stop(message) {
  console.error(`[catalog seed] ${message}`);
  process.exitCode = 1;
}

if (appEnv === 'production') {
  let isExample = false;
  try {
    isExample = JSON.parse(await readFile(seedPath, 'utf8'))._example === true;
  } catch {
    isExample = false;
  }
  stop(isExample
    ? 'Refusing to import an example catalog file in production. Copy it to data/catalog.seed.json, replace all values with owner-verified data, then run against staging.'
    : 'Refusing to seed production. Run this script only against a staging or preview database.');
} else if (!['staging', 'preview'].includes(appEnv)) {
  stop('Refusing to run unless APP_ENV is staging or preview. Never seed production.');
} else {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const productionHostGuard = process.env.PROD_DB_HOST_GUARD;
  if (!databaseUrl || !productionHostGuard) {
    stop('DATABASE_URL and PROD_DB_HOST_GUARD are required; values are never printed.');
  } else {
    let databaseHost;
    try {
      databaseHost = new URL(databaseUrl).hostname.toLowerCase();
    } catch {
      stop('The staging database URL is invalid; its value is never printed.');
    }
    if (databaseHost && databaseHost.includes(productionHostGuard.toLowerCase())) {
      stop('The configured database matches the production host guard. No rows were changed.');
    }
    if (!process.exitCode) {
      let seed;
      try {
        seed = JSON.parse(await readFile(seedPath, 'utf8'));
      } catch {
        stop(`Could not read ${seedPath}. Copy data/catalog.seed.example.json, then replace every value with owner-verified data.`);
      }

      if (seed?._example === true && appEnv === 'production') {
        stop('Refusing to import an example catalog file in production. Use data/catalog.seed.json with owner-verified rows in staging.');
      } else if (!Array.isArray(seed?.items) || !seed.items.length) {
        stop(`${seedPath} must contain a non-empty items array.`);
      } else {
        const classLevels = new Set([
          '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
          'o_level', 'a_level', 'university',
        ]);
        const keys = new Set();
        const validItems = seed.items.every((item) => {
          if (!item || typeof item !== 'object') return false;
          const key = typeof item.key === 'string' ? item.key.trim() : '';
          const valid = Boolean(key) && !keys.has(key)
            && classLevels.has(item.classLevel)
            && typeof item.subjectKey === 'string' && item.subjectKey.trim().length > 0 && item.subjectKey.trim().length <= 100
            && typeof item.title === 'string' && item.title.trim().length > 0 && item.title.trim().length <= 255
            && (item.board === undefined || item.board === null || (typeof item.board === 'string' && item.board.length <= 255))
            && (item.publisher === undefined || item.publisher === null || (typeof item.publisher === 'string' && item.publisher.length <= 255))
            && (item.personaGroup === undefined || item.personaGroup === null || (typeof item.personaGroup === 'string' && item.personaGroup.length <= 100))
            && ['available', 'coming_soon'].includes(item.status)
            && Array.isArray(item.starterTopics)
            && item.starterTopics.length <= 20
            && item.starterTopics.every((topic) => typeof topic === 'string' && topic.trim().length > 0 && topic.trim().length <= 120);
          if (valid) keys.add(key);
          return valid;
        });

        if (!validItems) {
          stop(`${seedPath} contains invalid or duplicate items. Check class, subject, title, status, group, and starter topics.`);
        } else {
          const { Pool } = pg;
          const pool = new Pool({
            connectionString: databaseUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 5000,
          });
          const stableUuid = (key) => {
            const hex = createHash('sha256').update(`gage-catalog:${key}`).digest('hex').slice(0, 32).split('');
            hex[12] = '5';
            hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
            const value = hex.join('');
            return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
          };

          try {
            const client = await pool.connect();
            try {
              await client.query('BEGIN');
              for (const [index, item] of seed.items.entries()) {
                if (item.personaGroup) {
                  const group = await client.query(
                    'SELECT 1 FROM expert_personas WHERE group_name = $1 LIMIT 1',
                    [item.personaGroup],
                  );
                  if (!group.rows.length) throw new Error(`Item "${item.key}" names a teacher group that does not exist.`);
                }
                await client.query(
                  `INSERT INTO catalog_books
                   (id, class_level, subject_key, title, board, publisher, persona_group,
                    status, starter_topics, display_order)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
                   ON CONFLICT DO NOTHING`,
                  [
                    stableUuid(item.key.trim()),
                    item.classLevel,
                    item.subjectKey.trim(),
                    item.title.trim(),
                    item.board?.trim() || null,
                    item.publisher?.trim() || null,
                    item.personaGroup?.trim() || null,
                    item.status,
                    JSON.stringify(item.starterTopics.map((topic) => topic.trim())),
                    Number.isSafeInteger(item.displayOrder) && item.displayOrder >= 0 ? item.displayOrder : index,
                  ],
                );
              }
              await client.query('COMMIT');
              console.log(`Catalog seed completed idempotently for ${seed.items.length} item(s) in ${appEnv}.`);
            } catch (error) {
              await client.query('ROLLBACK').catch(() => undefined);
              throw error;
            } finally {
              client.release();
            }
          } catch (error) {
            stop(`Catalog seed failed: ${error instanceof Error ? error.message : 'database error'}`);
          } finally {
            await pool.end();
          }
        }
      }
    }
  }
}

if (process.exitCode) {
  console.error('Usage: APP_ENV=staging PROD_DB_HOST_GUARD=<production-host-fragment> DATABASE_URL=<staging-db-url> node scripts/seed-catalog.mjs');
}
