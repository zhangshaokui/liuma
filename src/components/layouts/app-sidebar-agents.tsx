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
          <SidebarMenuItem className="flex items-center gap-1">
            <SidebarMenuButton
              onClick={() => router.push("/agents")}
              className="font-semibold flex-1 min-w-0"
            >
              <span className="truncate">{t("Layout.agents")}</span>
            </SidebarMenuButton>
            {canCreateAgent(userRole) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="size-4 flex items-center justify-center rounded hover:bg-accent transition-colors opacity-0 group-hover/agents:opacity-100 group-hover/agents:transition-opacity flex-shrink-0"
                    data-testid="sidebar-create-button"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push("/agent/new");
                    }}
                    data-testid="sidebar-create-agent-button"
                  >
                    创建智能体
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
