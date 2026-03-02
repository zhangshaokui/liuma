'use client';

import useSWR from 'swr';
import { fetcher } from 'lib/utils';

export function useCategories() {
  const { data: categories = [], error, isLoading } = useSWR(
    '/api/agent-categories',
    fetcher
  );

  return {
    categories,
    error,
    isLoading,
  };
}
