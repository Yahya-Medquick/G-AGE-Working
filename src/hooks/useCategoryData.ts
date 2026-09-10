import { useState, useEffect, useCallback, useRef } from "react";
import { CategoryApiResponse, CategoryType } from "../types";
import { fetchCategoryData, invalidateCache } from "../services/api";

export function useCategoryData(topic: string, activeCategory: CategoryType) {
  const [data, setData] = useState<CategoryApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [matchMode, setMatchMode] = useState<"all" | "any" | "phrase">("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Auto-reload state for failed tab loads
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const autoRetryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track the current active request to prevent race conditions when tabs switch quickly
  const lastRequestRef = useRef<{ topic: string; category: CategoryType; page: number }>({
    topic: "",
    category: activeCategory,
    page: 1,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const clearAutoRetryTimers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsAutoRetrying(false);
    setRetryCountdown(0);
  }, []);

  const loadCategory = useCallback(
    async (pageNum = 1, append = false, isRetryAttempt = false) => {
      if (!topic || activeCategory === "history") {
        setIsLoading(false);
        setIsLoadingMore(false);
        setError(null);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      lastRequestRef.current = { topic, category: activeCategory, page: pageNum };

      if (pageNum === 1 && !append) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const pageSize = activeCategory === "news" ? 6 : 10;
        const response = await fetchCategoryData(topic, activeCategory, pageNum, pageSize, isRetryAttempt, controller.signal, matchMode);

        // Verify request is still relevant
        if (
          lastRequestRef.current.topic.toLowerCase() !== topic.toLowerCase() ||
          lastRequestRef.current.category !== activeCategory
        ) {
          return;
        }

        setData((prevData) => {
          if (append && prevData) {
            return {
              ...response,
              items: [...prevData.items, ...response.items],
            };
          }
          return response;
        });

        setPage(pageNum);
        setHasMore(response.pagination?.hasMore || false);
        setError(null);
        autoRetryCountRef.current = 0; // Reset retry counter on success
        clearAutoRetryTimers();
      } catch (err: any) {
        if (err.name === "AbortError") return;

        if (
          lastRequestRef.current.topic.toLowerCase() === topic.toLowerCase() &&
          lastRequestRef.current.category === activeCategory
        ) {
          const errMsg = err.message || `Failed to load ${activeCategory} data.`;
          setError(errMsg);

          // Trigger auto-reload if under limit (max 3 auto-retries)
          if (pageNum === 1 && autoRetryCountRef.current < 3) {
            autoRetryCountRef.current += 1;
            const currentAttempt = autoRetryCountRef.current;
            setIsAutoRetrying(true);
            setRetryCountdown(2);

            let secondsLeft = 2;
            countdownIntervalRef.current = setInterval(() => {
              secondsLeft -= 1;
              if (secondsLeft >= 0) {
                setRetryCountdown(secondsLeft);
              }
            }, 1000);

            retryTimerRef.current = setTimeout(() => {
              clearAutoRetryTimers();
              invalidateCache(topic, activeCategory);
              loadCategory(1, false, true);
            }, 2000);
          } else {
            clearAutoRetryTimers();
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [topic, activeCategory, clearAutoRetryTimers, matchMode]
  );

  useEffect(() => {
    clearAutoRetryTimers();
    autoRetryCountRef.current = 0;
    setData(null);
    setPage(1);
    setHasMore(false);
    loadCategory(1, false);

    return () => {
      clearAutoRetryTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [topic, activeCategory, loadCategory, clearAutoRetryTimers, matchMode]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadCategory(page + 1, true);
    }
  }, [isLoadingMore, hasMore, page, loadCategory]);

  const manualRefetch = useCallback(() => {
    clearAutoRetryTimers();
    autoRetryCountRef.current = 0;
    invalidateCache(topic, activeCategory);
    loadCategory(1, false, true);
  }, [topic, activeCategory, loadCategory, clearAutoRetryTimers]);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    isAutoRetrying,
    retryCountdown,
    autoRetryCount: autoRetryCountRef.current,
    hasMore,
    loadMore,
    refetch: manualRefetch,
    matchMode,
    setMatchMode,
  };
}
