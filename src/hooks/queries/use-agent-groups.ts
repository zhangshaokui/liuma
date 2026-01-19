"use client";

import useSWR, { SWRConfiguration, useSWRConfig } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { fetcher } from "lib/utils";

// Types
export interface AgentGroup {
  id: string;
  userId: string;
  departmentId: string | null;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  type: "system" | "custom";
  createdAt: Date;
  updatedAt: Date;
}

interface UseAgentGroupsOptions extends SWRConfiguration {
  departmentId?: string;
}

// Get agent groups (optionally filtered by department)
export function useAgentGroups(options: UseAgentGroupsOptions = {}) {
  const { departmentId, ...swrOptions } = options;

  const queryString = departmentId ? `?departmentId=${departmentId}` : "";

  const {
    data: groups = [],
    error,
    isLoading,
    mutate,
  } = useSWR<AgentGroup[]>(`/api/agent-groups${queryString}`, fetcher, {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    onError: handleErrorWithToast,
    ...swrOptions,
  });

  return {
    groups,
    isLoading,
    error,
    mutate,
  };
}

// Hook for agent group mutations
export function useAgentGroupMutations() {
  const { mutate } = useSWRConfig();

  const createGroup = async (data: {
    name: string;
    departmentId?: string | null;
    color?: string;
    icon?: string;
    sortOrder?: number;
    type?: "system" | "custom";
  }) => {
    const response = await fetch("/api/agent-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create agent group");
    }

    // Revalidate all group caches
    mutate(
      (key) => typeof key === "string" && key.startsWith("/api/agent-groups"),
    );
    // Revalidate departments cache (since departments include groups)
    mutate("/api/department");

    return await response.json();
  };

  const updateGroup = async (
    id: string,
    data: {
      name?: string;
      departmentId?: string | null;
      color?: string;
      icon?: string;
      sortOrder?: number;
    },
  ) => {
    const response = await fetch("/api/agent-groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      throw new Error("Failed to update agent group");
    }

    // Revalidate all group caches
    mutate(
      (key) => typeof key === "string" && key.startsWith("/api/agent-groups"),
    );
    // Revalidate departments cache (since departments include groups)
    mutate("/api/department");

    return await response.json();
  };

  const deleteGroup = async (id: string) => {
    const response = await fetch(`/api/agent-groups?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete agent group");
    }

    // Revalidate all group caches
    mutate(
      (key) => typeof key === "string" && key.startsWith("/api/agent-groups"),
    );
    // Revalidate departments cache (since departments include groups)
    mutate("/api/department");

    return await response.json();
  };

  return {
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
