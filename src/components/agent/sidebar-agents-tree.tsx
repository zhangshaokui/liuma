"use client";

import { appStore } from "@/app/store";
import { useAgents } from "@/hooks/queries/use-agents";
import { useDepartments } from "@/hooks/queries/use-departments";
import { useMounted } from "@/hooks/use-mounted";
import { ChatMention } from "app-types/chat";
import { canCreateAgent } from "lib/auth/client-permissions";
import { BACKGROUND_COLORS, EMOJI_DATA } from "lib/const";
import { cn } from "lib/utils";
import { generateUUID } from "lib/utils";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
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
import { AgentDropdown } from "./agent-dropdown";

interface SidebarAgentsTreeProps {
  userRole?: string | null;
}

export function SidebarAgentsTree({ userRole }: SidebarAgentsTreeProps) {
  const mounted = useMounted();
  const router = useRouter();
  const { departments, isLoading } = useDepartments();
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);

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

  // 自动展开第一个部门
  useEffect(() => {
    if (departments && departments.length > 0 && expandedDepts.length === 0) {
      setExpandedDepts([departments[0].id]);
    }
  }, [departments, expandedDepts]);

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

  const handleDepartmentClick = useCallback(
    (deptId: string) => {
      router.push(`/agents?dept=${deptId}`);
    },
    [router],
  );

  const handleGroupClick = useCallback(
    (groupId: string) => {
      router.push(`/agents?group=${groupId}`);
    },
    [router],
  );

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
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* 部门列表 */}
          {departments
            ?.filter((dept) => dept.name !== "待分配部门") // 过滤掉待分配部门
            .map((dept) => {
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
                        className="flex-1 text-sm truncate cursor-pointer"
                        onClick={() => handleDepartmentClick(dept.id)}
                      >
                        {dept.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {agentCount}
                      </span>
                      {canCreateAgent(userRole) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push("/agents?action=createGroup");
                              }}
                              className="flex-shrink-0 w-5 h-5 flex items-center justify-center opacity-0 group-hover/dept:opacity-100 hover:bg-accent rounded transition-opacity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">新建小组</TooltipContent>
                        </Tooltip>
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
                            <SidebarMenuButton
                              onClick={() => handleGroupClick(group.id)}
                              className="group/group"
                            >
                              <span className="w-5" /> {/* 缩进占位 */}
                              <span className="text-sm mr-1">{group.icon}</span>
                              <span className="flex-1 text-sm truncate">
                                {group.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {groupAgents.length}
                              </span>
                            </SidebarMenuButton>

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
                </div>
              );
            })}

          {/* 新建部门按钮 */}
          {canCreateAgent(userRole) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push("/agents?action=createDepartment")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建部门
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
