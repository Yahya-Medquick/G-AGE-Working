export interface HedgedRequestCandidate<T> {
  id: string;
  run: (signal: AbortSignal, onFirstToken: () => void) => Promise<T>;
}

export function runHedgedRequests<T>(
  candidates: HedgedRequestCandidate<T>[],
  hedgeDelayMs = 2500,
  timeoutMs = 18_000
): Promise<T> {
  if (candidates.length === 0) return Promise.reject(new Error('No request candidates'));

  return new Promise<T>((resolve, reject) => {
    const active = new Map<number, AbortController>();
    let nextIndex = 0;
    let winner: number | null = null;
    let lastError: unknown;
    let hedgeTimer: ReturnType<typeof setTimeout> | undefined;
    const deadline = setTimeout(() => {
      if (winner !== null) return;
      for (const controller of active.values()) controller.abort();
      reject(lastError || new Error('Hedged request deadline exceeded'));
    }, timeoutMs);

    const clearHedgeTimer = () => {
      if (hedgeTimer) clearTimeout(hedgeTimer);
      hedgeTimer = undefined;
    };

    const scheduleHedge = () => {
      if (winner === null && active.size === 1 && nextIndex < candidates.length && !hedgeTimer) {
        hedgeTimer = setTimeout(() => {
          hedgeTimer = undefined;
          launch();
        }, hedgeDelayMs);
      }
    };

    const chooseWinner = (index: number) => {
      if (winner !== null) return;
      winner = index;
      clearHedgeTimer();
      for (const [activeIndex, controller] of active) {
        if (activeIndex !== index) controller.abort();
      }
    };

    const launch = () => {
      if (winner !== null || active.size >= 2 || nextIndex >= candidates.length) return;
      clearHedgeTimer();
      const index = nextIndex++;
      const candidate = candidates[index];
      const controller = new AbortController();
      active.set(index, controller);
      Promise.resolve()
        .then(() => candidate.run(controller.signal, () => chooseWinner(index)))
        .then((result) => {
          if (winner === null) chooseWinner(index);
          if (winner === index) {
            clearTimeout(deadline);
            resolve(result);
          }
        })
        .catch((error: unknown) => {
          active.delete(index);
          if (winner === index) {
            clearTimeout(deadline);
            reject(error);
            return;
          }
          if (winner !== null) return;
          lastError = error;
          if (active.size < 2 && nextIndex < candidates.length) launch();
          else if (active.size === 0 && nextIndex >= candidates.length) {
            clearTimeout(deadline);
            reject(lastError);
          } else {
            scheduleHedge();
          }
        })
        .finally(() => active.delete(index));
      scheduleHedge();
    };

    launch();
  });
}