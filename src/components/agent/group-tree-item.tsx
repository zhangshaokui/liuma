"use client";

import { useCallback } from "react";
import { cn } from "lib/utils";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { AgentGroup } from "@/hooks/queries/use-agent-groups";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "ui/context-menu";
import { GroupContextMenu } from "./group-context-menu";

interface GroupTreeItemProps {
  group: {
    id: string;
    name: string;
    color: string;
    icon: string;
    sortOrder: number;
    agentCount?: number;
  };
  isSelected?: boolean;
}

export function GroupTreeItem({ group, isSelected }: GroupTreeItemProps) {
  const { selectGroup, openContextMenu } = useAgentManagementStore();

  const handleSelect = useCallback(() => {
    selectGroup(group.id);
  }, [group.id, selectGroup]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openContextMenu("group", group.id, {
        x: e.clientX,
        y: e.clientY,
      });
    },
    [group.id, openContextMenu],
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors group",
            isSelected && "bg-accent",
          )}
          onClick={handleSelect}
          onContextMenu={handleContextMenu}
        >
          {/* 缩进 */}
          <div className="w-5 flex-shrink-0" />

          {/* 小组图标和名称 */}
          <span className="text-sm">{group.icon}</span>
          <span className="flex-1 text-sm truncate">{group.name}</span>

          {/* AI数量 */}
          <span className="text-xs text-muted-foreground">
            {group.agentCount ?? 0}
          </span>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <GroupContextMenu group={group} />
      </ContextMenuContent>
    </ContextMenu>
  );
}
