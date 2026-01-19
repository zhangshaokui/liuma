"use client";

import { Input } from "ui/input";
import { Search } from "lucide-react";
import { useAgentManagementStore } from "@/app/store/agent-management.store";

export function AgentSearchBar() {
  const { searchQuery, setSearchQuery } = useAgentManagementStore();

  return (
    <div className="relative w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="搜索AI员工..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 h-9"
      />
    </div>
  );
}
