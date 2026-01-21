"use client";

import { appStore } from "@/app/store";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { useAgents } from "@/hooks/queries/use-agents";
import { useDepartments } from "@/hooks/queries/use-departments";
import { useMounted } from "@/hooks/use-mounted";
import { ChatMention } from "app-types/chat";
import { canCreateAgent } from "lib/auth/client-permissions";
import { BACKGROUND_COLORS, EMOJI_DATA } from "lib/const";
import { cn } from "lib/utils";
import { generateUUID } from "lib/utils";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { AgentDropdown } from "./agent-dropdown";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/confirm-dialog";

interface SidebarAgentsTreeProps {
  userRole?: string | null;
}

export function SidebarAgentsTree({ userRole }: SidebarAgentsTreeProps) {
  console.log("SidebarAgentsTree component mounted/updated");
  const mounted = useMounted();
  const router = useRouter();
  const { departments, isLoading, mutate } = useDepartments();
  const {
    selectDepartment,
    selectGroup,
    selectedGroup,
    openEditDepartmentDialog,
    openEditGroupDialog,
    openCreateDepartmentDialog,
    openCreateGroupDialog,
  } = useAgentManagementStore();
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [deptMenuOpen, setDeptMenuOpen] = useState<string | null>(null);
  const [groupMenuOpen, setGroupMenuOpen] = useState<string | null>(null);

  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "department" | "group" | null;
    id: string | null;
    name: string | null;
  }>({
    open: false,
    type: null,
    id: null,
    name: null,
  });

  // 获取所有AI员工（按部门/小组分组）
  const { agents } = useAgents({ limit: 100 });

  // 按部门/小组分组AI员工
  const agentsByGroup = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    agents?.forEach((agent) => {
      if (agent.groupId) {
        if (!grouped[agent.groupId]) {
          grouped[agent.groupId] = [];
        }
        grouped[agent.groupId].push(agent);
      }
    });
    return grouped;
  }, [agents]);

  // 计算每个部门的AI员工总数（使用dept.agentCount）
  const departmentAgentCount = useMemo(() => {
    const count: Record<string, number> = {};
    departments?.forEach((dept) => {
      // 直接使用dept.agentCount，它已经包含了该部门所有小组的员工数
      count[dept.id] = dept.agentCount || 0;
    });
    return count;
  }, [departments]);

  const toggleDepartment = useCallback((deptId: string) => {
    setExpandedDepts((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    );
  }, []);

  // 不自动展开部门，默认全部折叠

  const handleAgentClick = useCallback(
    (agent: any) => {
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
    },
    [router],
  );

  const handleGroupClick = useCallback(
    (groupId: string) => {
      // 设置选中的小组，清空部门选择
      selectGroup(groupId);
      selectDepartment(null);
      // 跳转到 /agents 页面
      router.push(`/agents?group=${groupId}`);
    },
    [router, selectGroup, selectDepartment],
  );

  const handleDepartmentClick = useCallback(
    (e: React.MouseEvent, deptId: string) => {
      // 阻止事件冒泡
      e.preventDefault();
      e.stopPropagation();

      console.log("handleDepartmentClick called with deptId:", deptId);
      console.log("Current URL:", window.location.href);

      // 设置选中的部门，清空小组选择
      selectDepartment(deptId);
      selectGroup(null);

      // 展开/折叠部门
      toggleDepartment(deptId);

      // 跳转到 /agents 页面
      const targetUrl = `/agents?dept=${deptId}`;
      console.log("Navigating to:", targetUrl);
      router.push(targetUrl);
    },
    [router, selectDepartment, selectGroup, toggleDepartment],
  );

  // 删除部门
  const handleDeleteDepartment = useCallback(
    async (deptId: string, deptName: string) => {
      // 打开确认对话框
      setDeleteDialog({
        open: true,
        type: "department",
        id: deptId,
        name: deptName,
      });
    },
    [],
  );

  // 删除小组
  const handleDeleteGroup = useCallback(
    async (groupId: string, groupName: string) => {
      // 打开确认对话框
      setDeleteDialog({
        open: true,
        type: "group",
        id: groupId,
        name: groupName,
      });
    },
    [],
  );

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialog.type || !deleteDialog.id) return;

    try {
      if (deleteDialog.type === "department") {
        const res = await fetch(`/api/department?id=${deleteDialog.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("部门已删除");
          mutate();
        } else {
          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || "删除失败");
        }
      } else if (deleteDialog.type === "group") {
        const res = await fetch(`/api/agent-groups?id=${deleteDialog.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("小组已删除");
          if (selectedGroup === deleteDialog.id) {
            selectGroup(null);
          }
          mutate();
        } else {
          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || "删除失败");
        }
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("删除失败");
    } finally {
      setDeleteDialog({ open: false, type: null, id: null, name: null });
    }
  }, [deleteDialog, mutate, selectedGroup, selectGroup]);

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenuItem>
            {mounted && <SidebarMenuSkeleton />}
          </SidebarMenuItem>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {/* 部门列表 */}
            {departments?.map((dept) => {
              const isExpanded = expandedDepts.includes(dept.id);
              const agentCount = departmentAgentCount[dept.id] || 0;

              return (
                <div key={dept.id}>
                  {/* 部门项 */}
                  <SidebarMenuItem>
                    <div className="group/dept flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent transition-colors w-full">
                      <button
                        onClick={() => toggleDepartment(dept.id)}
                        className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-accent rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-sm mr-1">{dept.icon}</span>
                      <span
                        className="flex-1 text-sm truncate cursor-pointer hover:underline"
                        onClick={(e) => handleDepartmentClick(e, dept.id)}
                      >
                        {dept.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {agentCount}
                      </span>
                      {canCreateAgent(userRole) && (
                        <DropdownMenu
                          open={deptMenuOpen === dept.id}
                          onOpenChange={(open) => {
                            if (!open) setDeptMenuOpen(null);
                            else setDeptMenuOpen(dept.id);
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeptMenuOpen(dept.id);
                              }}
                              className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-accent rounded"
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setDeptMenuOpen(null);
                                openEditDepartmentDialog(dept);
                              }}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setDeptMenuOpen(null);
                                handleDeleteDepartment(dept.id, dept.name);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </SidebarMenuItem>

                  {/* 小组列表 */}
                  {isExpanded && (
                    <div className="ml-4">
                      {dept.groups.map((group) => {
                        const groupAgents = agentsByGroup[group.id] || [];

                        return (
                          <SidebarMenuItem key={group.id}>
                            <div className="group/group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent transition-colors w-full">
                              <span className="w-5 flex-shrink-0" />{" "}
                              {/* 缩进占位 */}
                              <span className="text-sm mr-1">{group.icon}</span>
                              <span
                                className="flex-1 text-sm truncate cursor-pointer hover:underline"
                                onClick={() => handleGroupClick(group.id)}
                              >
                                {group.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {group.agentCount}
                              </span>
                              {canCreateAgent(userRole) && (
                                <DropdownMenu
                                  open={groupMenuOpen === group.id}
                                  onOpenChange={(open) => {
                                    if (!open) setGroupMenuOpen(null);
                                    else setGroupMenuOpen(group.id);
                                  }}
                                >
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setGroupMenuOpen(group.id);
                                      }}
                                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-accent rounded"
                                    >
                                      <MoreHorizontal className="w-3 h-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setGroupMenuOpen(null);
                                        openEditGroupDialog(group);
                                      }}
                                    >
                                      <Pencil className="w-4 h-4 mr-2" />
                                      重命名
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setGroupMenuOpen(null);
                                        handleDeleteGroup(group.id, group.name);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      删除
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            {/* 小组下的AI员工 */}
                            {groupAgents.map((agent, idx) => (
                              <SidebarMenuItem key={agent.id} className="ml-6">
                                <SidebarMenuButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAgentClick(agent);
                                  }}
                                  className="group/agent"
                                >
                                  <div
                                    className="p-0.5 rounded-full ring-2 ring-border bg-background mr-2 flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        agent.icon?.style?.backgroundColor ||
                                        BACKGROUND_COLORS[
                                          idx % BACKGROUND_COLORS.length
                                        ],
                                    }}
                                  >
                                    <Avatar className="size-3">
                                      <AvatarImage
                                        src={
                                          agent.icon?.value ||
                                          EMOJI_DATA[idx % EMOJI_DATA.length]
                                        }
                                      />
                                      <AvatarFallback className="bg-transparent text-[8px]">
                                        {agent.name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <span className="flex-1 text-xs truncate">
                                    {agent.name}
                                  </span>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <AgentDropdown agent={agent} side="right">
                                      <button className="flex-shrink-0 w-5 h-5 flex items-center justify-center opacity-0 group-hover/agent:opacity-100 hover:bg-accent rounded transition-opacity">
                                        <MoreHorizontal className="w-3 h-3" />
                                      </button>
                                    </AgentDropdown>
                                  </div>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenuItem>
                        );
                      })}
                    </div>
                  )}

                  {/* 展开/折叠状态下都显示"+ 新建小组"按钮 */}
                  {isExpanded && canCreateAgent(userRole) && (
                    <SidebarMenuItem
                      key={`add-group-${dept.id}`}
                      className="ml-6"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateGroupDialog(dept.id);
                        }}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-1"
                      >
                        <PlusCircle className="w-3 h-3" />
                        新小组
                      </button>
                    </SidebarMenuItem>
                  )}
                </div>
              );
            })}

            {/* "+ 新建部门"按钮 */}
            {canCreateAgent(userRole) && (
              <SidebarMenuItem>
                <button
                  onClick={() => openCreateDepartmentDialog()}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  新部门
                </button>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        title={deleteDialog.type === "department" ? "删除部门" : "删除小组"}
        description={
          deleteDialog.type === "department"
            ? `确定要删除部门"${deleteDialog.name}"吗？此操作不会删除部门下的AI员工，它们将被移至"默认部门"。`
            : `确定要删除小组"${deleteDialog.name}"吗？此操作不会删除小组下的AI员工，它们将被移至"未分组"。`
        }
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
