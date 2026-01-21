"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { AgentGroup } from "@/hooks/queries/use-agent-groups";
import { useAgentGroupMutations } from "@/hooks/queries/use-agent-groups";
import { ContextMenuItem } from "ui/context-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserPlus, Edit, Trash2 } from "lucide-react";
import { handleErrorWithToast } from "ui/shared-toast";
import { toast } from "sonner";
import { safe } from "ts-safe";

interface GroupContextMenuProps {
  group: {
    id: string;
    name: string;
    color: string;
    icon: string;
    sortOrder: number;
    agentCount?: number;
    type?: string;
    departmentId?: string | null;
  };
}

export function GroupContextMenu({ group }: GroupContextMenuProps) {
  const _t = useTranslations();
  const { openEditGroupDialog } = useAgentManagementStore();
  const { deleteGroup } = useAgentGroupMutations();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    if (group.name === "未分组" || group.type === "system") {
      toast.error("系统小组不能删除");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    safe(() => deleteGroup(group.id))
      .ifOk(() => {
        toast.success("小组已删除");
      })
      .ifFail((e) => {
        handleErrorWithToast(e);
        toast.error("删除失败");
      });
  };

  return (
    <>
      <ContextMenuItem
        onClick={() =>
          openEditGroupDialog({
            id: group.id,
            name: group.name,
            color: group.color,
            icon: group.icon,
            departmentId: group.departmentId ?? null,
          })
        }
      >
        <Edit className="w-4 h-4 mr-2" />
        重命名小组
      </ContextMenuItem>

      {group.type === "custom" && group.name !== "未分组" && (
        <ContextMenuItem
          onClick={handleDeleteClick}
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          删除小组
        </ContextMenuItem>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除小组"
        description={`确定要删除小组"${group.name}"吗？该操作不会删除小组下的AI员工，它们将被移到"未分组"。`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
