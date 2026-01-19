"use client";

import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { DepartmentWithGroups } from "@/hooks/queries/use-departments";
import { useDepartmentMutations } from "@/hooks/queries/use-departments";
import { ContextMenuItem } from "ui/context-menu";
import { Edit, Trash2, Users } from "lucide-react";
import { handleErrorWithToast } from "ui/shared-toast";
import { toast } from "sonner";
import { safe } from "ts-safe";

interface DepartmentContextMenuProps {
  department: DepartmentWithGroups;
}

export function DepartmentContextMenu({
  department,
}: DepartmentContextMenuProps) {
  const { openCreateGroupDialog, openEditDepartmentDialog } =
    useAgentManagementStore();

  const { deleteDepartment } = useDepartmentMutations();

  const handleCreateGroup = async () => {
    openCreateGroupDialog(department.id);
  };

  const handleDelete = async () => {
    if (department.name === "待分配部门") {
      toast.error("默认部门不能删除");
      return;
    }

    const ok = await (window as any).notify?.confirm({
      title: "删除部门",
      description: `确定要删除部门"${department.name}"吗？该操作不会删除部门下的AI员工，它们将被移到"待分配部门"。`,
    });
    if (!ok) return;

    safe(() => deleteDepartment(department.id))
      .ifOk(() => {
        toast.success("部门已删除");
      })
      .ifFail((e) => {
        handleErrorWithToast(e);
        toast.error("删除失败");
      });
  };

  return (
    <>
      <ContextMenuItem onClick={handleCreateGroup}>
        <Users className="w-4 h-4 mr-2" />
        新建小组
      </ContextMenuItem>

      <ContextMenuItem
        onClick={() =>
          openEditDepartmentDialog({
            id: department.id,
            name: department.name,
            color: department.color,
            icon: department.icon,
          })
        }
      >
        <Edit className="w-4 h-4 mr-2" />
        重命名部门
      </ContextMenuItem>

      {department.name !== "待分配部门" && (
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          删除部门
        </ContextMenuItem>
      )}
    </>
  );
}
