"use client";

import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { useMutateAgents } from "@/hooks/queries/use-agents";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "ui/resizable";
import { AgentBoardView } from "./agent-board-view";
import { CreateDepartmentDialog } from "./create-department-dialog";
import { CreateGroupDialog } from "./create-group-dialog";
import { DepartmentSidebar } from "./department-sidebar";
import { MoveAgentDialog } from "./move-agent-dialog";

interface AgentsManagedListProps {
  userId: string;
  userRole?: string | null;
  initialDeptId?: string;
  initialGroupId?: string;
  action?: string;
}

export function AgentsManagedList({
  userId,
  userRole,
  initialDeptId,
  initialGroupId,
  action,
}: AgentsManagedListProps) {
  const t = useTranslations();
  const mutateAgents = useMutateAgents();
  const {
    isCreateDepartmentDialogOpen,
    isCreateGroupDialogOpen,
    isMoveAgentDialogOpen,
    openCreateDepartmentDialog,
    openCreateGroupDialog,
    closeCreateDepartmentDialog,
    closeCreateGroupDialog,
    closeMoveAgentDialog,
    creatingGroupDepartmentId,
    selectDepartment,
    selectGroup,
    expandDepartment,
  } = useAgentManagementStore();

  // 根据URL参数自动选中部门/小组
  useEffect(() => {
    if (initialGroupId) {
      selectGroup(initialGroupId);
      // 如果有小组ID，展开所属部门
      // 需要先获取部门数据来找到这个小组属于哪个部门
    } else if (initialDeptId) {
      selectDepartment(initialDeptId);
      expandDepartment(initialDeptId);
    }

    // 处理action参数（打开创建对话框）
    if (action === "createDepartment") {
      openCreateDepartmentDialog();
    } else if (action === "createGroup") {
      openCreateGroupDialog();
    }
  }, [
    initialDeptId,
    initialGroupId,
    action,
    selectDepartment,
    selectGroup,
    expandDepartment,
    openCreateDepartmentDialog,
    openCreateGroupDialog,
  ]);

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
