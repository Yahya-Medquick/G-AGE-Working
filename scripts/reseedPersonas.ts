import pg from 'pg';
import { EXPERTS, EXPERTS_PK } from '../src/data/experts';

const { Pool } = pg;

async function runMigration() {
  console.log('[Migration] Starting expert_personas table reseed...');

  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/gage';
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    try {
      console.log('[Migration] Connected to database. Ensuring expert_personas schema...');

      // Ensure variant column exists
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

      console.log('[Migration] Clearing existing expert_personas table...');
      await client.query('DELETE FROM expert_personas;');

      let order = 1;

      // Seed global personas
      for (const [key, expert] of Object.entries(EXPERTS)) {
        const slug = expert.id || key;
        const openerTemplate = expert.opener
          ? expert.opener('{topic}')
          : `I see you are exploring **{topic}**. How can I assist your research or learning on this subject?`;

        await client.query(
          `INSERT INTO expert_personas 
           (slug, name, initials, role, affiliation, badge, avatar_color, specialties, domains, description, personality, opener_template, system_prompt, is_active, is_default, display_order, variant)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, $15, 'global')`,
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
            slug === 'aisha', // default persona
            order++
          ]
        );
      }

      // Seed Pakistani personas
      for (const [key, expert] of Object.entries(EXPERTS_PK)) {
        const slug = `${expert.id || key}_pk`;
        const openerTemplate = expert.opener
          ? expert.opener('{topic}')
          : `I see you are exploring **{topic}**. How can I assist your research or learning on this subject?`;

        await client.query(
          `INSERT INTO expert_personas 
           (slug, name, initials, role, affiliation, badge, avatar_color, specialties, domains, description, personality, opener_template, system_prompt, is_active, is_default, display_order, variant)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, false, $14, 'pk')`,
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
            order++
          ]
        );
      }

      console.log(`[Migration] Successfully reseeded ${order - 1} personas into expert_personas table!`);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[Migration] Note: Database not running or connection refused during CLI script run:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error('[Migration] Failed:', err);
});
