"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";

export interface EmployeeItem {
  id: string;
  isEmployee?: boolean;
}

export function useEmployeeActions() {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const { mutate } = useSWRConfig();

  const toggleEmployee = async (item: EmployeeItem) => {
    const { id, isEmployee = false } = item;

    if (loadingIds.has(id)) return;

    setLoadingIds((prev) => new Set(prev).add(id));

    try {
      // Make the API call to the employee endpoint
      const response = await fetch(`/api/employee`, {
        method: isEmployee ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee");
      }

      // Update all relevant caches
      await mutate(
        (key) => {
          if (typeof key !== "string") return false;
          // Update agent list endpoints
          return (
            key.startsWith("/api/agent") ||
            key.startsWith("/api/employee")
          );
        },
        undefined,
        { revalidate: true },
      );

      return !isEmployee; // Return new employee state
    } catch (error) {
      console.error("Error toggling employee:", error);
      throw error;
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const addEmployee = async (agentId: string) => {
    return toggleEmployee({ id: agentId, isEmployee: false });
  };

  const removeEmployee = async (agentId: string) => {
    return toggleEmployee({ id: agentId, isEmployee: true });
  };

  return {
    toggleEmployee,
    addEmployee,
    removeEmployee,
    isLoading: (agentId: string) => loadingIds.has(agentId),
  };
}
