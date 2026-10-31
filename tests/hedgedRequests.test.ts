import { describe, expect, it } from 'vitest';
import { runHedgedRequests } from '../src/utils/hedgedRequests';

describe('runHedgedRequests', () => {
  it('starts a hedge and returns the first token winner while aborting the loser', async () => {
    let slowAborted = false;
    const result = await runHedgedRequests([
      {
        id: 'slow',
        run: (signal) => new Promise<string>((_, reject) => {
          signal.addEventListener('abort', () => {
            slowAborted = true;
            reject(new Error('aborted'));
          }, { once: true });
        }),
      },
      {
        id: 'fast',
        run: async (_signal, onFirstToken) => {
          onFirstToken();
          return 'fast result';
        },
      },
    ], 10, 200);

    expect(result).toBe('fast result');
    expect(slowAborted).toBe(true);
  });

  it('advances immediately after a failed candidate', async () => {
    const result = await runHedgedRequests([
      { id: 'failing', run: async () => { throw new Error('failed'); } },
      { id: 'working', run: async (_signal, onFirstToken) => { onFirstToken(); return 'working'; } },
    ], 100, 200);

    expect(result).toBe('working');
  });

  it('keeps at most two attempts in flight', async () => {
    let active = 0;
    let maxActive = 0;
    const makeCandidate = (id: string, waitMs: number, fail = false) => ({
      id,
      run: async (_signal: AbortSignal, onFirstToken: () => void) => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        active--;
        if (fail) throw new Error(id);
        onFirstToken();
        return id;
      },
    });

    const result = await runHedgedRequests([
      makeCandidate('slow', 40, true),
      makeCandidate('failing', 5, true),
      makeCandidate('fast', 5),
    ], 5, 200);

    expect(result).toBe('fast');
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});