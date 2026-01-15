"use client";

import useSWR from "swr";
import { fetcher } from "lib/utils";

interface UseTemplatesOptions {
  search?: string;
  category?: string | null;
}

export function useTemplates(options: UseTemplatesOptions = {}) {
  const { search, category } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (category) queryParams.set("category", category);

  const queryString = queryParams.toString();
  const url = queryString ? "/api/agent-templates?" + queryString : "/api/agent-templates";

  const {
    data: templates = [],
    error,
    isLoading,
    mutate,
  } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    templates,
    error,
    isLoading,
    mutate,
  };
}
