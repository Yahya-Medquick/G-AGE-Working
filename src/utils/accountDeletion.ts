export interface AccountDeletionClient {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{
    rows: Array<{ id?: string; phone?: string | null }>;
    rowCount: number | null;
  }>;
  release(): void;
}

export interface AccountDeletionPool {
  connect(): Promise<AccountDeletionClient>;
}

export async function deleteAccountRecords(pool: AccountDeletionPool, userId: string): Promise<boolean> {
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query('BEGIN');
    transactionOpen = true;
    const account = await client.query(
      'SELECT id, phone FROM users WHERE id = $1 FOR UPDATE',
      [userId],
    );
    if (!account.rows.length) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return false;
    }

    await client.query('DELETE FROM user_tab_usage WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_search_history WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM counseling_sessions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM notes WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_persona_usage WHERE user_id::text = $1', [userId]);
    const phone = account.rows[0].phone;
    if (phone) {
      await client.query('DELETE FROM phone_otp_logs WHERE phone = $1', [phone]);
    }

    const deletion = await client.query('DELETE FROM users WHERE id = $1', [userId]);
    if (deletion.rowCount !== 1) {
      throw new Error('The account was not deleted.');
    }

    await client.query('COMMIT');
    transactionOpen = false;
    return true;
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], 'Account deletion failed and the database rollback also failed.');
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
