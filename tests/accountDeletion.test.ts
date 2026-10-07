import { describe, expect, it } from 'vitest';
import { deleteAccountRecords, type AccountDeletionClient, type AccountDeletionPool } from '../src/utils/accountDeletion';
import { clearAccountLocalData, type AccountStorage } from '../src/utils/accountLocalData';

function createPool(options: {
  accountExists?: boolean;
  failOn?: string;
} = {}) {
  const queries: Array<{ sql: string; values?: unknown[] }> = [];
  let released = false;
  const client: AccountDeletionClient = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql === options.failOn) throw new Error('query failed');
      if (sql.startsWith('SELECT id, phone')) {
        return {
          rows: options.accountExists === false ? [] : [{ id: 'user-id', phone: '+15555550123' }],
          rowCount: options.accountExists === false ? 0 : 1,
        };
      }
      return { rows: [], rowCount: sql === 'DELETE FROM users WHERE id = $1' ? 1 : 0 };
    },
    release() {
      released = true;
    },
  };
  const pool: AccountDeletionPool = { connect: async () => client };
  return { pool, queries, wasReleased: () => released };
}

describe('account deletion transaction', () => {
  it('deletes user-owned data and the account atomically', async () => {
    const { pool, queries, wasReleased } = createPool();

    await expect(deleteAccountRecords(pool, 'user-id')).resolves.toBe(true);

    expect(queries.map(({ sql }) => sql)).toEqual([
      'BEGIN',
      'SELECT id, phone FROM users WHERE id = $1 FOR UPDATE',
      'DELETE FROM user_tab_usage WHERE user_id = $1',
      'DELETE FROM user_search_history WHERE user_id = $1',
      'DELETE FROM counseling_sessions WHERE user_id = $1',
      'DELETE FROM notes WHERE user_id = $1',
      'DELETE FROM user_persona_usage WHERE user_id::text = $1',
      'DELETE FROM phone_otp_logs WHERE phone = $1',
      'DELETE FROM users WHERE id = $1',
      'COMMIT',
    ]);
    expect(queries.every(({ values }) => !values || values.every((value) => value === 'user-id' || value === '+15555550123'))).toBe(true);
    expect(wasReleased()).toBe(true);
  });

  describe('account local-data cleanup', () => {
    it('removes account data without touching another user or device preferences', () => {
      const data = new Map([
        ['bifrost_session_token', 'token'],
        ['bifrost_notes', 'notes'],
        ['bifrost_chat_sessions_v2_user_user-id', 'account chats'],
        ['bifrost_active_session_id_v2_user_user-id', 'active account chat'],
        ['bifrost_chat_sessions_v2_user_other-user', 'other account chats'],
        ['bifrost_expert_chat_user-id_pk_teacher', 'legacy account chat'],
        ['gage_class_prompt_dismissed:user-id', 'true'],
        ['atlas_theme', 'dark'],
        ['bifrost_device_id', 'device-id'],
      ]);
      const storage: AccountStorage = {
        get length() {
          return data.size;
        },
        key(index) {
          return [...data.keys()][index] ?? null;
        },
        removeItem(key) {
          data.delete(key);
        },
      };

      clearAccountLocalData('user-id', storage);

      expect([...data.keys()].sort()).toEqual([
        'atlas_theme',
        'bifrost_chat_sessions_v2_user_other-user',
        'bifrost_device_id',
      ]);
    });
  });

  it('rolls back when the account is missing and releases the connection', async () => {
    const { pool, queries, wasReleased } = createPool({ accountExists: false });

    await expect(deleteAccountRecords(pool, 'missing-user')).resolves.toBe(false);

    expect(queries.map(({ sql }) => sql)).toEqual([
      'BEGIN',
      'SELECT id, phone FROM users WHERE id = $1 FOR UPDATE',
      'ROLLBACK',
    ]);
    expect(wasReleased()).toBe(true);
  });

  it('rolls back all deletions when a child-record deletion fails', async () => {
    const { pool, queries, wasReleased } = createPool({ failOn: 'DELETE FROM notes WHERE user_id = $1' });

    await expect(deleteAccountRecords(pool, 'user-id')).rejects.toThrow('query failed');

    expect(queries.at(-1)?.sql).toBe('ROLLBACK');
    expect(queries.some(({ sql }) => sql === 'DELETE FROM users WHERE id = $1')).toBe(false);
    expect(wasReleased()).toBe(true);
  });
});
