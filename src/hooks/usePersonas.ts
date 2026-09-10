import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExpertPersona, EXPERTS, EXPERTS_PK } from '../data/experts';
import { fetchPersonas, organizePersonasByVariant } from '../stores/personaStore';

export function usePersonas() {
  const [rawPersonas, setRawPersonas] = useState<ExpertPersona[]>([]);
  const [isLoadedFromApi, setIsLoadedFromApi] = useState(false);

  const loadPersonas = useCallback(async (forceRefresh = false) => {
    try {
      const data = await fetchPersonas(undefined, forceRefresh);
      if (data && data.length > 0) {
        setRawPersonas([...data]);
        setIsLoadedFromApi(true);
      }
    } catch (err) {
      // Silent fallback to static EXPERTS / EXPERTS_PK if API fetch fails
    }
  }, []);

  useEffect(() => {
    // Fetch once on mount
    loadPersonas();

    // Passive 5 minute background refresh for cross-session sync
    const interval = setInterval(() => {
      fetchPersonas(undefined, false).then(data => {
        if (data && data.length > 0) {
          setRawPersonas([...data]);
          setIsLoadedFromApi(true);
        }
      });
    }, 5 * 60 * 1000);

    // Immediate sync when admin makes a change in same session
    const handleUpdated = () => {
      loadPersonas(true);
    };
    window.addEventListener('personas-updated', handleUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('personas-updated', handleUpdated);
    };
  }, [loadPersonas]);

  const { globalExperts, pkExperts } = useMemo(() => {
    if (!isLoadedFromApi || rawPersonas.length === 0) {
      return { globalExperts: EXPERTS, pkExperts: EXPERTS_PK };
    }
    return organizePersonasByVariant(rawPersonas);
  }, [rawPersonas, isLoadedFromApi]);

  return {
    rawPersonas,
    globalExperts,
    pkExperts,
    isLoadedFromApi,
    refreshPersonas: loadPersonas,
  };
}
