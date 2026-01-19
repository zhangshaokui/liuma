"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "ui/resizable";
import { Button } from "ui/button";
import { Plus } from "lucide-react";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { useMutateAgents } from "@/hooks/queries/use-agents";
import { DepartmentSidebar } from "./department-sidebar";
import { AgentBoardView } from "./agent-board-view";
import { CreateDepartmentDialog } from "./create-department-dialog";
import { CreateGroupDialog } from "./create-group-dialog";
import { MoveAgentDialog } from "./move-agent-dialog";

interface AgentsManagedListProps {
  userId: string;
  userRole?: string | null;
}

export function AgentsManagedList({
  userId,
  userRole,
}: AgentsManagedListProps) {
  const t = useTranslations();
  const mutateAgents = useMutateAgents();
  const {
    isCreateDepartmentDialogOpen,
    isCreateGroupDialogOpen,
    isMoveAgentDialogOpen,
    openCreateDepartmentDialog,
    closeCreateDepartmentDialog,
    closeCreateGroupDialog,
    closeMoveAgentDialog,
    creatingGroupDepartmentId,
  } = useAgentManagementStore();

  const handleRefresh = () => {
    mutateAgents();
  };

  return (
    <>
      <div className="w-full h-full flex flex-col">
        {/* 顶部工具栏 */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <h1 className="text-xl font-semibold">{t("Layout.agents")}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={openCreateDepartmentDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            新建部门
          </Button>
        </div>

        {/* 主内容区：左侧导航 + 右侧看板 */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* 左侧导航 */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <DepartmentSidebar userId={userId} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* 右侧看板 */}
            <ResizablePanel defaultSize={75}>
              <AgentBoardView
                userId={userId}
                userRole={userRole}
                onAgentsChange={handleRefresh}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* 创建部门对话框 */}
      {isCreateDepartmentDialogOpen && (
        <CreateDepartmentDialog
          open={isCreateDepartmentDialogOpen}
          onOpenChange={(open) => !open && closeCreateDepartmentDialog()}
          onSuccess={handleRefresh}
        />
      )}

      {/* 创建小组对话框 */}
      {isCreateGroupDialogOpen && (
        <CreateGroupDialog
          open={isCreateGroupDialogOpen}
          onOpenChange={(open) => !open && closeCreateGroupDialog()}
          defaultDepartmentId={creatingGroupDepartmentId || undefined}
          onSuccess={handleRefresh}
        />
      )}

      {/* 移动AI员工对话框 */}
      {isMoveAgentDialogOpen && (
        <MoveAgentDialog
          open={isMoveAgentDialogOpen}
          onOpenChange={(open) => !open && closeMoveAgentDialog()}
          onSuccess={handleRefresh}
        />
      )}
    </>
  );
}
