"use client";

import { useCallback } from "react";
import { ChevronRight, ChevronDown, MoreVertical, Plus } from "lucide-react";
import { cn } from "lib/utils";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { DepartmentWithGroups } from "@/hooks/queries/use-departments";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "ui/context-menu";
import { Button } from "ui/button";
import { DepartmentContextMenu } from "./department-context-menu";
import { GroupTreeItem } from "./group-tree-item";

interface DepartmentTreeItemProps {
  department: DepartmentWithGroups;
}

export function DepartmentTreeItem({ department }: DepartmentTreeItemProps) {
  const {
    expandedDepartments,
    selectedDepartment,
    selectedGroup,
    toggleDepartment,
    selectDepartment,
    selectGroup,
    openContextMenu,
    openCreateGroupDialog,
  } = useAgentManagementStore();

  const isExpanded = expandedDepartments.includes(department.id);
  const isSelected = selectedDepartment === department.id;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleDepartment(department.id);
    },
    [department.id, toggleDepartment],
  );

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // 只有点击非箭头按钮区域才toggle并选中
      // 箭头按钮有自己的handleToggle
      const target = e.target as HTMLElement;
      const isArrowButton = target.closest('button[data-arrow="true"]');

      if (!isArrowButton) {
        // 只在有小组时才toggle
        if (department.groups.length > 0) {
          toggleDepartment(department.id);
        }
        selectDepartment(department.id);
        selectGroup(null); // 清除小组选择
      }
    },
    [
      department.id,
      department.groups.length,
      toggleDepartment,
      selectDepartment,
      selectGroup,
    ],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openContextMenu("department", department.id, {
        x: e.clientX,
        y: e.clientY,
      });
    },
    [department.id, openContextMenu],
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>
          {/* 部门项 */}
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors group",
              isSelected && "bg-accent",
            )}
            onClick={handleSelect}
            onContextMenu={handleContextMenu}
          >
            {/* 展开/折叠按钮 */}
            <button
              data-arrow="true"
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-accent rounded"
              onClick={handleToggle}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* 部门图标和名称 */}
            <span className="text-lg">{department.icon}</span>
            <span className="flex-1 text-sm font-medium truncate">
              {department.name}
            </span>

            {/* AI数量 */}
            <span className="text-xs text-muted-foreground">
              {department.agentCount}
            </span>

            {/* 更多按钮 */}
            <button
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent rounded transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e as any);
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* 小组列表（折叠/展开） */}
          {isExpanded && (
            <div className="ml-6 mt-1 space-y-0.5">
              {department.groups.map((group) => (
                <GroupTreeItem
                  key={group.id}
                  group={group}
                  isSelected={selectedGroup === group.id}
                />
              ))}
              {/* 新建小组按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateGroupDialog(department.id);
                }}
              >
                <Plus className="w-3 h-3 mr-2" />
                新建小组
              </Button>
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <DepartmentContextMenu department={department} />
      </ContextMenuContent>
    </ContextMenu>
  );
}
