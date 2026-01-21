"use client";

import useSWR, { SWRConfiguration, useSWRConfig } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { fetcher } from "lib/utils";
import { authClient } from "auth/client";

// Types
export interface DepartmentWithGroups {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  groups: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    sortOrder: number;
    agentCount: number;
    type?: string;
    departmentId: string | null;
  }>;
  agentCount: number;
}

export interface Department {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UseDepartmentsOptions extends SWRConfiguration {}

// Get all departments with groups
export function useDepartments(options: UseDepartmentsOptions = {}) {
  const { ...swrOptions } = options;

  const {
    data: departments = [],
    error,
    isLoading,
    mutate,
  } = useSWR<DepartmentWithGroups[]>("/api/department", fetcher, {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    onError: handleErrorWithToast,
    ...swrOptions,
  });

  return {
    departments,
    isLoading,
    error,
    mutate,
  };
}

// Hook for department mutations
export function useDepartmentMutations() {
  const { mutate } = useSWRConfig();

  const createDepartment = async (data: {
    name: string;
    color?: string;
    icon?: string;
    sortOrder?: number;
  }) => {
    const response = await fetch("/api/department", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create department");
    }

    // Revalidate departments cache
    mutate("/api/department");

    return await response.json();
  };

  const updateDepartment = async (
    id: string,
    data: {
      name?: string;
      color?: string;
      icon?: string;
      sortOrder?: number;
    },
  ) => {
    const response = await fetch("/api/department", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      throw new Error("Failed to update department");
    }

    // Revalidate departments cache
    mutate("/api/department");

    return await response.json();
  };

  const deleteDepartment = async (id: string) => {
    const response = await fetch(`/api/department?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete department");
    }

    // Revalidate departments cache
    mutate("/api/department");

    return await response.json();
  };

  return {
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
