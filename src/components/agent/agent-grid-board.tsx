"use client";

import { useTranslations } from "next-intl";
import { ShareableCard } from "@/components/shareable-card";
import { AgentSummary } from "app-types/agent";
import { useMutateAgents } from "@/hooks/queries/use-agents";
import { handleErrorWithToast } from "ui/shared-toast";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { useState } from "react";
import { MoveAgentDialog } from "./move-agent-dialog";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { DepartmentWithGroups } from "@/lib/db/pg/repositories/department-repository.pg";
import { appStore } from "@/app/store";
import { ChatMention } from "app-types/chat";
import { generateUUID } from "lib/utils";
import { useRouter } from "next/navigation";

interface AgentGridBoardProps {
  agents: AgentSummary[];
  isLoading?: boolean;
  userRole?: string | null;
  totalCount?: number;
  onAgentsMutate?: () => void;
  onAgentsChange?: () => void;
  departments?: DepartmentWithGroups[];
}

export function AgentGridBoard({
  agents,
  isLoading,
  totalCount,
  onAgentsMutate,
  onAgentsChange,
  departments,
}: AgentGridBoardProps) {
  const t = useTranslations();
  const router = useRouter();
  const mutateAgents = useMutateAgents();
  const { openMoveAgentDialog, closeMoveAgentDialog, isMoveAgentDialogOpen } =
    useAgentManagementStore();
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [visibilityChangeLoading, setVisibilityChangeLoading] = useState<
    string | null
  >(null);

  // 查找 agent 所属的部门和小组名称
  const getAgentDepartmentInfo = (agent: AgentSummary) => {
    if (!agent.groupId || !departments) {
      return { departmentName: undefined, groupName: undefined };
    }

    for (const dept of departments) {
      const group = dept.groups.find((g) => g.id === agent.groupId);
      if (group) {
        return {
          departmentName: dept.name,
          groupName: group.name,
        };
      }
    }

    return { departmentName: undefined, groupName: undefined };
  };

  // 点击卡片直接对话
  const handleCardClick = (agent: AgentSummary) => {
    const newMention: ChatMention = {
      type: "agent",
      agentId: agent.id,
      name: agent.name,
      icon: agent.icon,
      description: agent.description,
    };

    const newThreadId = generateUUID();
    appStore.setState(() => ({
      threadMentions: {
        [newThreadId]: [newMention],
      },
    }));
    router.push(`/chat/${newThreadId}`);
  };

  const handleDelete = async (agentId: string) => {
    const ok = await (window as any).notify?.confirm({
      title: t("Common.delete"),
      description: t("Agent.deleteConfirm"),
    });
    if (!ok) return;

    safe(() => setDeletingAgentId(agentId))
      .map(async () => {
        const response = await fetch(`/api/agent/${agentId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete agent");
        return response.json();
      })
      .ifOk(() => {
        mutateAgents({ id: agentId }, true);
        toast.success(t("Agent.deleted"));
        onAgentsChange?.();
      })
      .ifFail((e) => {
        handleErrorWithToast(e);
        toast.error(t("Common.error"));
      })
      .watch(() => setDeletingAgentId(null));
  };

  const handleVisibilityChange = async (
    agentId: string,
    visibility: "readonly" | "public" | "private",
  ) => {
    safe(() => setVisibilityChangeLoading(agentId))
      .map(async () => {
        const response = await fetch(`/api/agent/${agentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility }),
        });
        if (!response.ok) throw new Error("Failed to update visibility");
        return response.json();
      })
      .ifOk(() => {
        mutateAgents({ id: agentId, visibility });
        toast.success(t("Agent.visibilityUpdated"));
      })
      .ifFail((e) => {
        handleErrorWithToast(e);
        toast.error(t("Common.error"));
      })
      .watch(() => setVisibilityChangeLoading(null));
  };

  const handleMoveAgent = (agentId: string, agentName: string) => {
    openMoveAgentDialog(agentId, agentName);
  };

  // 空状态
  if (!isLoading && agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-lg font-semibold mb-2">暂无AI员工</h3>
        <p className="text-sm text-muted-foreground">
          请选择一个小组查看AI员工
        </p>
      </div>
    );
  }

  // 加载状态 - 只在初次加载时显示（避免切换时闪现）
  if (isLoading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 统计信息 */}
      {totalCount !== undefined && (
        <div className="mb-4 text-sm text-muted-foreground">
          共 {totalCount} 个AI员工
        </div>
      )}

      {/* AI员工网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <ShareableCard
            key={agent.id}
            type="agent"
            item={agent}
            href={`/agent/${agent.id}`}
            onCardClick={() => handleCardClick(agent)}
            onVisibilityChange={handleVisibilityChange}
            isVisibilityChangeLoading={visibilityChangeLoading === agent.id}
            isDeleteLoading={deletingAgentId === agent.id}
            onDelete={handleDelete}
            hideVisibilityAndBookmark={true}
            onMove={() => handleMoveAgent(agent.id, agent.name)}
            departmentInfo={getAgentDepartmentInfo(agent)}
          />
        ))}
      </div>

      {/* 移动AI员工对话框 */}
      <MoveAgentDialog
        open={isMoveAgentDialogOpen}
        onOpenChange={closeMoveAgentDialog}
        onSuccess={onAgentsMutate}
      />
    </div>
  );
}
