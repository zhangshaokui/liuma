"use client";

import { useEffect } from "react";
import { ScrollArea } from "ui/scroll-area";
import { Input } from "ui/input";
import { Button } from "ui/button";
import { Search, Plus, Users } from "lucide-react";
import { cn } from "lib/utils";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { useDepartments } from "@/hooks/queries/use-departments";
import { DepartmentTreeItem } from "./department-tree-item";

interface DepartmentSidebarProps {
  userId: string;
}

export function DepartmentSidebar({}: DepartmentSidebarProps) {
  const { departments, isLoading } = useDepartments();
  const {
    expandedDepartments,
    selectedDepartment,
    selectedGroup,
    searchQuery,
    setSearchQuery,
    openCreateDepartmentDialog,
    expandDepartment,
    selectDepartment,
    selectGroup,
  } = useAgentManagementStore();

  // 自动展开第一个部门
  useEffect(() => {
    if (
      departments &&
      departments.length > 0 &&
      expandedDepartments.length === 0
    ) {
      expandDepartment(departments[0].id);
    }
  }, [departments, expandedDepartments, expandDepartment]);

  const handleSelectAll = () => {
    selectDepartment(null);
    selectGroup(null);
  };

  const isSelectedAll = !selectedDepartment && !selectedGroup;

  // 过滤部门/小组
  const filteredDepartments = departments.filter((dept) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    // 匹配部门名称
    if (dept.name.toLowerCase().includes(query)) return true;

    // 匹配小组名称
    return dept.groups.some((group) =>
      group.name.toLowerCase().includes(query),
    );
  });

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* 搜索栏 */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索部门或小组..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 部门树形列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* 全部AI员工 */}
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors",
              isSelectedAll && "bg-accent",
            )}
            onClick={handleSelectAll}
          >
            <span className="text-lg">👥</span>
            <span className="flex-1 text-sm font-medium">全部AI员工</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              加载中...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <p>暂无部门</p>
              <p className="text-xs mt-1">点击下方按钮创建</p>
            </div>
          ) : (
            filteredDepartments.map((department) => (
              <DepartmentTreeItem key={department.id} department={department} />
            ))
          )}

          {/* 新建部门按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground h-7 px-2"
            onClick={openCreateDepartmentDialog}
          >
            <Plus className="w-3 h-3 mr-2" />
            新建部门
          </Button>
        </div>
      </ScrollArea>

      {/* 底部统计信息 */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        {departments.length} 个部门 ·{" "}
        {departments.reduce((sum, dept) => sum + dept.groups.length, 0)} 个小组
      </div>
    </div>
  );
}
