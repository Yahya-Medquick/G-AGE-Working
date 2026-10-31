import pg from 'pg';
import { EXPERTS, EXPERTS_PK } from '../src/data/experts';

const { Pool } = pg;

async function upsertPersonas() {
  console.log('[Migration] Starting expert_personas upsert...');

  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/gage';
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS expert_personas (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug          VARCHAR(64) UNIQUE NOT NULL,
          name          VARCHAR(128) NOT NULL,
          initials      VARCHAR(4) NOT NULL,
          role          VARCHAR(128) NOT NULL,
          affiliation   VARCHAR(256),
          badge         VARCHAR(64) NOT NULL,
          avatar_color  VARCHAR(16) DEFAULT '#6366f1',
          specialties   TEXT[] DEFAULT '{}',
          domains       TEXT[] DEFAULT '{}',
          description   TEXT,
          personality   VARCHAR(256),
          opener_template TEXT,
          system_prompt TEXT,
          is_active     BOOLEAN DEFAULT true,
          is_default    BOOLEAN DEFAULT false,
          display_order INTEGER DEFAULT 0,
          variant       VARCHAR(16) DEFAULT 'global',
          created_at    TIMESTAMPTZ DEFAULT now(),
          updated_at    TIMESTAMPTZ DEFAULT now()
        );
      `);

      await client.query(`
        ALTER TABLE expert_personas ADD COLUMN IF NOT EXISTS variant VARCHAR(16) DEFAULT 'global';
      `);

      const personaSets = [
        { variant: 'global', experts: EXPERTS },
        { variant: 'pk', experts: EXPERTS_PK },
      ] as const;

      let count = 0;
      for (const { variant, experts } of personaSets) {
        for (const [key, expert] of Object.entries(experts)) {
          const slug = variant === 'pk' ? `${expert.id || key}_pk` : (expert.id || key);
          const openerTemplate = expert.opener ? expert.opener('{topic}') : `I see you are exploring **{topic}**. How can I assist your research or learning on this subject?`;

          await client.query(
            `INSERT INTO expert_personas (
              slug, name, initials, role, affiliation, badge, avatar_color, specialties, domains,
              description, personality, opener_template, system_prompt, is_active, is_default,
              display_order, variant
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, $15, $16)
            ON CONFLICT (slug) DO UPDATE SET
              name = EXCLUDED.name,
              initials = EXCLUDED.initials,
              role = EXCLUDED.role,
              affiliation = EXCLUDED.affiliation,
              badge = EXCLUDED.badge,
              avatar_color = EXCLUDED.avatar_color,
              specialties = EXCLUDED.specialties,
              domains = EXCLUDED.domains,
              description = EXCLUDED.description,
              personality = EXCLUDED.personality,
              opener_template = EXCLUDED.opener_template,
              system_prompt = EXCLUDED.system_prompt,
              is_active = EXCLUDED.is_active,
              is_default = EXCLUDED.is_default,
              display_order = EXCLUDED.display_order,
              variant = EXCLUDED.variant,
              updated_at = now()
            `,
            [
              slug,
              expert.name,
              expert.initials,
              expert.role,
              expert.affiliation,
              expert.badge,
              expert.avatar_color,
              expert.specialties,
              expert.domains,
              expert.description,
              expert.personality,
              openerTemplate,
              expert.system_prompt,
              slug === 'aisha' || slug === 'aisha_pk',
              count + 1,
              variant,
            ]
          );
          count += 1;
        }
      }

      console.log(`[Migration] Upserted ${count} expert personas successfully.`);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[Migration] Database not running or connection refused:', err.message);
  } finally {
    await pool.end();
  }
}

upsertPersonas().catch((err) => {
  console.error('[Migration] Failed:', err);
});
