import { useAgents } from "@/hooks/queries/use-agents";
import { useMemo } from "react";

export function useRecentAgents(limit = 3) {
  const { agents = [] } = useAgents();

  const recentAgents = useMemo(() => {
    return [...agents]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }, [agents]);

  return recentAgents;
}
