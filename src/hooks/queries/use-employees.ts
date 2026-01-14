"use client";

import useSWR from "swr";

export interface EmployeeAgent {
  id: string;
  name: string;
  description: string | null;
  icon: any;
  visibility: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useEmployees() {
  const { data, error, isLoading, mutate } = useSWR<{
    employees: EmployeeAgent[];
  }> ("/api/employee", {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    employees: data?.employees || [],
    isLoading,
    error,
    mutate,
  };
}
