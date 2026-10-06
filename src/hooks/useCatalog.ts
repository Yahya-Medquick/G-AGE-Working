import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthHeaders } from '../services/api';
import type { CatalogResponse } from '../types/catalog';
import type { ClassLevelId } from '../data/classLevels';

const CATALOG_CACHE_PREFIX = 'gage_catalog_v1';

interface CatalogState {
  catalog: CatalogResponse | null;
  loading: boolean;
  stale: boolean;
  error: string | null;
}

function readCachedCatalog(classLevel: ClassLevelId): CatalogResponse | null {
  try {
    const raw = localStorage.getItem(`${CATALOG_CACHE_PREFIX}_${classLevel}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogResponse;
    return parsed?.success && Array.isArray(parsed.subjects) ? parsed : null;
  } catch {
    return null;
  }
}

export function useCatalog(classLevel: ClassLevelId | null) {
  const requestId = useRef(0);
  const [state, setState] = useState<CatalogState>({
    catalog: null,
    loading: Boolean(classLevel),
    stale: false,
    error: null,
  });

  const reload = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    if (!classLevel) {
      setState({ catalog: null, loading: false, stale: false, error: null });
      return;
    }
    const cached = readCachedCatalog(classLevel);
    setState({ catalog: cached, loading: true, stale: Boolean(cached), error: null });
    try {
      const response = await fetch(`/api/catalog?classLevel=${encodeURIComponent(classLevel)}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
      const catalog = await response.json() as CatalogResponse;
      if (currentRequestId !== requestId.current) return;
      if (!catalog.success || !Array.isArray(catalog.subjects)) {
        throw new Error('Catalog response was invalid');
      }
      try {
        localStorage.setItem(`${CATALOG_CACHE_PREFIX}_${classLevel}`, JSON.stringify(catalog));
      } catch (error) {
        console.warn('Unable to cache subject catalog:', error);
      }
      setState({ catalog, loading: false, stale: false, error: null });
    } catch (error) {
      if (currentRequestId !== requestId.current) return;
      setState({
        catalog: cached,
        loading: false,
        stale: Boolean(cached),
        error: cached ? null : 'Unable to load the subject catalog. Check your internet connection and retry.',
      });
      if (!cached) console.warn('Catalog request failed:', error);
    }
  }, [classLevel]);

  useEffect(() => {
    void reload();
    return () => {
      requestId.current += 1;
    };
  }, [reload]);

  return { ...state, reload };
}
