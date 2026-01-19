"use client";

import { PlusIcon, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { SidebarMenuAction } from "ui/sidebar";
import { SidebarMenuButton } from "ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroup } from "ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { SidebarAgentsTree } from "@/components/agent/sidebar-agents-tree";
import { canCreateAgent } from "lib/auth/client-permissions";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function AppSidebarAgents({ userRole }: { userRole?: string | null }) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/agents">
        <SidebarMenu className="group/agents" data-testid="agents-sidebar-menu">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => router.push("/agents")}
              className="font-semibold"
            >
              {t("Layout.agents")}
            </SidebarMenuButton>
            {canCreateAgent(userRole) && (
              <SidebarMenuAction className="group-hover/agents:opacity-100 opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <MoreHorizontal
                          className="size-4"
                          data-testid="sidebar-create-button"
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        新建...
                      </TooltipContent>
                    </Tooltip>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        router.push("/agent/new");
                      }}
                      data-testid="sidebar-create-agent-button"
                    >
                      新建AI员工
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        router.push("/agents?action=createDepartment");
                      }}
                    >
                      新建部门
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuAction>
            )}
          </SidebarMenuItem>
        </SidebarMenu>

        {/* 部门/小组树形结构 */}
        <SidebarAgentsTree userRole={userRole} />

        {/* 空白间距 */}
        <div className="h-4"></div>

        {/* Agent Store - 一级标签 */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="font-semibold">
              <Link href="/agent-store" data-testid="agent-store-link">
                {t("Layout.agentStore")}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
