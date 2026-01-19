"use client";

import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { Search } from "lucide-react";
import { Input } from "ui/input";

export function AgentSearchBar() {
  const { agentSearchQuery, setAgentSearchQuery } = useAgentManagementStore();

  return (
    <div className="relative w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="搜索AI员工..."
        value={agentSearchQuery}
        onChange={(e) => setAgentSearchQuery(e.target.value)}
        className="pl-9 h-9"
      />
    </div>
  );
}
