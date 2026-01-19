"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { SidebarMenuAction } from "ui/sidebar";
import { SidebarMenuButton } from "ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroup } from "ui/sidebar";

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
            <SidebarMenuButton asChild className="font-semibold">
              <Link href="/agents" data-testid="agents-link">
                {t("Layout.agents")}
              </Link>
            </SidebarMenuButton>
            {canCreateAgent(userRole) && (
              <SidebarMenuAction
                className="group-hover/agents:opacity-100 opacity-0 transition-opacity"
                onClick={() => router.push("/agent/new")}
                data-testid="sidebar-create-agent-button"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PlusIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    {t("Agent.newAgent")}
                  </TooltipContent>
                </Tooltip>
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
