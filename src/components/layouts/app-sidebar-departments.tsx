"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "ui/sidebar";
import {
  MoreHorizontal,
  PlusIcon,
  ChevronDown,
  ChevronRight,
  Building2Icon,
  UsersIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { BACKGROUND_COLORS, EMOJI_DATA } from "lib/const";
import { appStore } from "@/app/store";
import { useRouter } from "next/navigation";
import { ChatMention } from "app-types/chat";

interface Department {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Group {
  id: string;
  name: string;
  departmentId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Employee {
  id: string;
  name: string;
  description?: string;
  icon?: any;
  isDefault: boolean;
}


export function AppSidebarDepartments() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Record<string, Group[]>>({});
  const [groupAgents, setGroupAgents] = useState<Record<string, Employee[]>>({});
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set(),
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // 对话框状态
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);
  const [showEditDepartmentDialog, setShowEditDepartmentDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [showManageAgentsDialog, setShowManageAgentsDialog] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 加载部门
      const deptResponse = await fetch("/api/department");
      if (deptResponse.ok) {
        const depts = await deptResponse.json();
        setDepartments(depts);
      }

      // 加载所有AI员工
      const employeesResponse = await fetch("/api/agent/all-employees");
      if (employeesResponse.ok) {
        const employees = await employeesResponse.json();
        setAllEmployees(employees);
      }

      // 加载所有小组
      const groupsResponse = await fetch("/api/group");
      if (groupsResponse.ok) {
        const allGroups = await groupsResponse.json();
        const groupsByDept: Record<string, Group[]> = {};
        for (const group of allGroups) {
          if (!groupsByDept[group.departmentId]) {
            groupsByDept[group.departmentId] = [];
          }
          groupsByDept[group.departmentId].push(group);
        }
        setGroups(groupsByDept);

        // 加载每个小组的AI员工
        const agentsByGroup: Record<string, Employee[]> = {};
        for (const group of allGroups) {
          const agentsResponse = await fetch(`/api/group/${group.id}/agents`);
          if (agentsResponse.ok) {
            const agents = await agentsResponse.json();
            agentsByGroup[group.id] = agents;
          }
        }
        setGroupAgents(agentsByGroup);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换部门展开/折叠
  const toggleDepartment = (departmentId: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(departmentId)) {
        next.delete(departmentId);
      } else {
        next.add(departmentId);
      }
      return next;
    });
  };

  // 切换小组展开/折叠
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // 创建部门
  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      alert("部门名称不能为空");
      return;
    }
    if (newDepartmentName.length > 10) {
      alert("部门名称不能超过10个字符");
      return;
    }

    try {
      const response = await fetch("/api/department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDepartmentName.trim() }),
      });

      if (response.ok) {
        const department = await response.json();
        setDepartments([...departments, department]);
        setNewDepartmentName("");
        setShowAddDepartmentDialog(false);
      } else {
        const error = await response.json();
        alert(error.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create department:", error);
      alert("创建失败，请稍后重试");
    }
  };

  // 更新部门
  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;
    if (!newDepartmentName.trim()) {
      alert("部门名称不能为空");
      return;
    }
    if (newDepartmentName.length > 10) {
      alert("部门名称不能超过10个字符");
      return;
    }

    try {
      const response = await fetch(`/api/department?id=${editingDepartment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDepartmentName.trim() }),
      });

      if (response.ok) {
        const updated = await response.json();
        setDepartments(
          departments.map((d) => (d.id === updated.id ? updated : d)),
        );
        setNewDepartmentName("");
        setEditingDepartment(null);
        setShowEditDepartmentDialog(false);
      } else {
        const error = await response.json();
        alert(error.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update department:", error);
      alert("更新失败，请稍后重试");
    }
  };

  // 删除部门
  const handleDeleteDepartment = async (department: Department) => {
    if (!confirm(`确定要删除部门"${department.name}"吗？这将删除该部门下的所有小组。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/department?id=${department.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDepartments(departments.filter((d) => d.id !== department.id));
        const newGroups = { ...groups };
        delete newGroups[department.id];
        setGroups(newGroups);
      } else {
        alert("删除失败");
      }
    } catch (error) {
      console.error("Failed to delete department:", error);
      alert("删除失败，请稍后重试");
    }
  };

  // 创建小组
  const handleCreateGroup = async (departmentId: string) => {
    if (!newGroupName.trim()) {
      alert("小组名称不能为空");
      return;
    }
    if (newGroupName.length > 10) {
      alert("小组名称不能超过10个字符");
      return;
    }

    try {
      const response = await fetch("/api/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          departmentId,
        }),
      });

      if (response.ok) {
        const group = await response.json();
        setGroups({
          ...groups,
          [departmentId]: [...(groups[departmentId] || []), group],
        });
        setNewGroupName("");
        setShowAddGroupDialog(false);
      } else {
        const error = await response.json();
        alert(error.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("创建失败，请稍后重试");
    }
  };

  // 更新小组
  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    if (!newGroupName.trim()) {
      alert("小组名称不能为空");
      return;
    }
    if (newGroupName.length > 10) {
      alert("小组名称不能超过10个字符");
      return;
    }

    try {
      const response = await fetch(`/api/group?id=${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (response.ok) {
        const updated = await response.json();
        setGroups({
          ...groups,
          [updated.departmentId]: (groups[updated.departmentId] || []).map(
            (g) => (g.id === updated.id ? updated : g),
          ),
        });
        setNewGroupName("");
        setEditingGroup(null);
        setShowEditGroupDialog(false);
      } else {
        const error = await response.json();
        alert(error.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update group:", error);
      alert("更新失败，请稍后重试");
    }
  };

  // 删除小组
  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`确定要删除小组"${group.name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/group?id=${group.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGroups({
          ...groups,
          [group.departmentId]: (groups[group.departmentId] || []).filter(
            (g) => g.id !== group.id,
          ),
        });
        const newGroupAgents = { ...groupAgents };
        delete newGroupAgents[group.id];
        setGroupAgents(newGroupAgents);
      } else {
        alert("删除失败");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("删除失败，请稍后重试");
    }
  };

  // 打开管理AI员工对话框
  const handleOpenManageAgents = (group: Group) => {
    setManagingGroup(group);
    const currentAgents = groupAgents[group.id] || [];
    setSelectedAgentIds(new Set(currentAgents.map((a) => a.id)));
    setShowManageAgentsDialog(true);
  };

  // 保存AI员工关联
  const handleSaveGroupAgents = async () => {
    if (!managingGroup) return;

    try {
      const response = await fetch(`/api/group?id=${managingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentIds: Array.from(selectedAgentIds) }),
      });

      if (response.ok) {
        const groupWithAgents = await response.json();
        setGroupAgents({
          ...groupAgents,
          [managingGroup.id]: groupWithAgents.agents || [],
        });
        setShowManageAgentsDialog(false);
        setManagingGroup(null);
        setSelectedAgentIds(new Set());
      } else {
        const errorData = await response.json();
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : (errorData.error?.message || JSON.stringify(errorData.error) || "保存失败");
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Failed to save group agents:", error);
      alert("保存失败，请稍后重试");
    }
  };

  // 点击AI员工
  const handleAgentClick = useCallback(
    (employee: Employee) => {
      const currentThreadId = appStore.getState().currentThreadId;

      const newMention: ChatMention = {
        type: "agent",
        agentId: employee.id,
        name: employee.name,
        icon: employee.icon,
        description: employee.description,
      };

      if (currentThreadId) {
        appStore.setState((prev) => {
          const currentMentions = prev.threadMentions[currentThreadId] || [];

          const target = currentMentions.find(
            (mention) =>
              mention.type == "agent" && mention.agentId === employee.id,
          );

          if (target) {
            return prev;
          }

          return {
            threadMentions: {
              ...prev.threadMentions,
              [currentThreadId]: [
                ...currentMentions.filter((v) => v.type != "agent"),
                newMention,
              ],
            },
          };
        });
      } else {
        router.push("/");

        appStore.setState(() => ({
          pendingThreadMention: newMention,
        }));
      }
    },
    [router],
  );

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="font-semibold">
                <Building2Icon className="size-4 text-primary" />
                部门
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/departments">
          <SidebarMenu className="group/departments">
            <SidebarMenuItem>
              <SidebarMenuButton className="font-semibold">
                <Building2Icon className="size-4 text-primary" />
                部门
              </SidebarMenuButton>
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuAction className="group-hover/departments:opacity-100 opacity-0 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <MoreHorizontal className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        管理部门
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuAction>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" side="right" align="start">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setNewDepartmentName("");
                      setShowAddDepartmentDialog(true);
                    }}
                  >
                    <PlusIcon className="size-4 mr-2" />
                    添加部门
                  </Button>
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>

            {departments.length === 0 ? (
              <SidebarMenuItem>
                <div className="px-2 mt-1">
                  <div className="bg-input/40 py-4 px-4 rounded-lg text-xs">
                    <p className="text-muted-foreground text-center">
                      暂无部门，点击上方"..."添加部门
                    </p>
                  </div>
                </div>
              </SidebarMenuItem>
            ) : (
              departments.map((department) => {
                const isExpanded = expandedDepartments.has(department.id);
                const departmentGroups = groups[department.id] || [];

                return (
                  <SidebarMenu key={department.id} className="group/department-item">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className="font-semibold pr-16"
                        onClick={() => toggleDepartment(department.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4 mr-1" />
                        ) : (
                          <ChevronRight className="size-4 mr-1" />
                        )}
                        <span className="flex-1 text-left">{department.name}</span>
                      </SidebarMenuButton>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuAction
                            className="opacity-0 group-hover/department-item:opacity-100 transition-opacity right-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewGroupName("");
                              setShowAddGroupDialog(true);
                              // 保存当前部门ID以便创建小组时使用
                              (window as any).__currentDepartmentId = department.id;
                            }}
                          >
                            <PlusIcon className="size-4" />
                          </SidebarMenuAction>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          添加小组
                        </TooltipContent>
                      </Tooltip>
                      <Popover>
                        <PopoverTrigger asChild>
                          <SidebarMenuAction
                            className="opacity-0 group-hover/department-item:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </SidebarMenuAction>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" side="right" align="start">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setEditingDepartment(department);
                              setNewDepartmentName(department.name);
                              setShowEditDepartmentDialog(true);
                            }}
                          >
                            编辑部门
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive"
                            onClick={() => handleDeleteDepartment(department)}
                          >
                            删除部门
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </SidebarMenuItem>

                    {isExpanded && (
                      <SidebarMenuSub>
                        {departmentGroups.length === 0 ? (
                          <SidebarMenuSubItem>
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                              暂无小组
                            </div>
                          </SidebarMenuSubItem>
                        ) : (
                          departmentGroups.map((group) => {
                            const isGroupExpanded = expandedGroups.has(group.id);
                            const agents = groupAgents[group.id] || [];

                            return (
                              <SidebarMenuSubItem key={group.id}>
                                <div className="flex items-center w-full">
                                  <SidebarMenuSubButton
                                    className="flex-1"
                                    onClick={() => toggleGroup(group.id)}
                                  >
                                    {isGroupExpanded ? (
                                      <ChevronDown className="size-3 mr-1" />
                                    ) : (
                                      <ChevronRight className="size-3 mr-1" />
                                    )}
                                    <UsersIcon className="size-3 mr-1" />
                                    {group.name}
                                  </SidebarMenuSubButton>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="size-3" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-1" side="right" align="start">
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => {
                                          setEditingGroup(group);
                                          setNewGroupName(group.name);
                                          setShowEditGroupDialog(true);
                                        }}
                                      >
                                        编辑小组
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => handleOpenManageAgents(group)}
                                      >
                                        加入AI员工
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start text-destructive"
                                        onClick={() => handleDeleteGroup(group)}
                                      >
                                        删除小组
                                      </Button>
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                {isGroupExpanded && (
                                  <div className="ml-4 mt-1 space-y-1">
                                    {agents.length === 0 ? (
                                      <div className="px-2 py-1 text-xs text-muted-foreground">
                                        暂无AI员工
                                      </div>
                                    ) : (
                                      agents.map((agent, idx) => (
                                        <div
                                          key={agent.id}
                                          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-input/50 cursor-pointer"
                                          onClick={() => handleAgentClick(agent)}
                                        >
                                          <div
                                            className="p-1 rounded-full ring-2 ring-border bg-background"
                                            style={{
                                              backgroundColor:
                                                agent.icon?.style?.backgroundColor ||
                                                BACKGROUND_COLORS[
                                                  idx % BACKGROUND_COLORS.length
                                                ],
                                            }}
                                          >
                                            <Avatar className="size-3.5">
                                              <AvatarImage
                                                src={
                                                  agent.icon?.value ||
                                                  EMOJI_DATA[idx % EMOJI_DATA.length]
                                                }
                                              />
                                              <AvatarFallback className="bg-transparent">
                                                {agent.name[0]}
                                              </AvatarFallback>
                                            </Avatar>
                                          </div>
                                          <span className="text-xs truncate flex-1">
                                            {agent.name}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </SidebarMenuSubItem>
                            );
                          })
                        )}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenu>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* 添加部门对话框 */}
      <Dialog open={showAddDepartmentDialog} onOpenChange={setShowAddDepartmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加部门</DialogTitle>
            <DialogDescription>创建一个新的部门（最多20个，名称最长10个字符）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dept-name">部门名称</Label>
              <Input
                id="dept-name"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="请输入部门名称"
                maxLength={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDepartmentDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreateDepartment}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑部门对话框 */}
      <Dialog open={showEditDepartmentDialog} onOpenChange={setShowEditDepartmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑部门</DialogTitle>
            <DialogDescription>修改部门名称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-dept-name">部门名称</Label>
              <Input
                id="edit-dept-name"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="请输入部门名称"
                maxLength={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDepartmentDialog(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateDepartment}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加小组对话框 */}
      <Dialog open={showAddGroupDialog} onOpenChange={setShowAddGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加小组</DialogTitle>
            <DialogDescription>创建一个新的小组（每个部门最多8个，名称最长10个字符）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">小组名称</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="请输入小组名称"
                maxLength={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddGroupDialog(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  const deptId = (window as any).__currentDepartmentId;
                  if (deptId) {
                    handleCreateGroup(deptId);
                  }
                }}
              >
                确定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑小组对话框 */}
      <Dialog open={showEditGroupDialog} onOpenChange={setShowEditGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑小组</DialogTitle>
            <DialogDescription>修改小组名称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-group-name">小组名称</Label>
              <Input
                id="edit-group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="请输入小组名称"
                maxLength={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditGroupDialog(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateGroup}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 管理AI员工对话框 */}
      <Dialog open={showManageAgentsDialog} onOpenChange={setShowManageAgentsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>管理AI员工</DialogTitle>
            <DialogDescription>
              选择要加入小组"{managingGroup?.name}"的AI员工
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {allEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedAgentIds.has(employee.id)}
                  onCheckedChange={(checked) => {
                    setSelectedAgentIds((prev) => {
                      const next = new Set(prev);
                      if (checked) {
                        next.add(employee.id);
                      } else {
                        next.delete(employee.id);
                      }
                      return next;
                    });
                  }}
                />
                <div
                  className="p-1 rounded-full ring-2 ring-border bg-background"
                  style={{
                    backgroundColor:
                      employee.icon?.style?.backgroundColor ||
                      BACKGROUND_COLORS[0],
                  }}
                >
                  <Avatar className="size-6">
                    <AvatarImage
                      src={employee.icon?.value || EMOJI_DATA[0]}
                    />
                    <AvatarFallback className="bg-transparent">
                      {employee.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{employee.name}</p>
                  {employee.description && (
                    <p className="text-xs text-muted-foreground">
                      {employee.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowManageAgentsDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveGroupAgents}>确定</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

