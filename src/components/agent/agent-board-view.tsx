"use client";

import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { useAgentsByGroup } from "@/hooks/queries/use-agents";
import { useDepartments } from "@/hooks/queries/use-departments";
import { AgentGridBoard } from "./agent-grid-board";
import { AgentSearchBar } from "./agent-search-bar";

interface AgentBoardViewProps {
  userId: string;
  userRole?: string | null;
  onAgentsChange?: () => void;
}

export function AgentBoardView({
  userRole,
  onAgentsChange,
}: AgentBoardViewProps) {
  const { departments } = useDepartments();
  const { selectedDepartment, selectedGroup, agentSearchQuery } =
    useAgentManagementStore();

  const { agents, isLoading, mutate } = useAgentsByGroup({
    groupId: selectedGroup || undefined,
    departmentId: selectedGroup ? undefined : selectedDepartment || undefined,
  });

  // 根据搜索查询过滤AI员工
  const filteredAgents = agents.filter((agent) => {
    if (!agentSearchQuery) return true;

    const query = agentSearchQuery.toLowerCase();
    return (
      agent.name?.toLowerCase().includes(query) ||
      agent.description?.toLowerCase().includes(query)
    );
  });

  // 获取当前选中的部门/小组名称
  const selectedDepartmentName = departments?.find(
    (d) => d.id === selectedDepartment,
  )?.name;

  // 查找小组所属的部门
  const selectedGroupDepartment = selectedGroup
    ? departments?.find((d) => d.groups.some((g) => g.id === selectedGroup))
    : null;

  const selectedGroupName = selectedGroup
    ? selectedGroupDepartment?.groups.find((g) => g.id === selectedGroup)?.name
    : null;

  const breadcrumb = selectedGroup
    ? `${selectedGroupDepartment?.name || "未知部门"} > ${selectedGroupName || "未知小组"}`
    : selectedDepartment
      ? selectedDepartmentName || "未知部门"
      : "全部AI员工";

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 顶部面包屑和搜索 */}
      <div className="h-14 border-b flex items-center justify-between px-6">
        <div className="text-sm text-muted-foreground">{breadcrumb}</div>
        <AgentSearchBar />
      </div>

      {/* AI员工网格 */}
      <div className="flex-1 overflow-auto p-6">
        <AgentGridBoard
          agents={filteredAgents}
          isLoading={isLoading}
          userRole={userRole}
          totalCount={filteredAgents.length}
          onAgentsMutate={mutate}
          onAgentsChange={onAgentsChange}
        />
      </div>
    </div>
  );
}
