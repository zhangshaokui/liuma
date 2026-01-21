"use client";

import { useState } from "react";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { DepartmentWithGroups } from "@/hooks/queries/use-departments";
import { useDepartmentMutations } from "@/hooks/queries/use-departments";
import { ContextMenuItem } from "ui/context-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCreateGroup = async () => {
    openCreateGroupDialog(department.id);
  };

  const handleDeleteClick = () => {
    if (department.name === "默认部门") {
      toast.error("默认部门不能删除");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
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

      {department.name !== "默认部门" && (
        <ContextMenuItem
          onClick={handleDeleteClick}
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          删除部门
        </ContextMenuItem>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除部门"
        description={`确定要删除部门"${department.name}"吗？该操作不会删除部门下的AI员工，它们将被移到"默认部门"。`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
