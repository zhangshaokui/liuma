"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Label } from "ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { useDepartments } from "@/hooks/queries/use-departments";
import { handleErrorWithToast } from "ui/shared-toast";
import { toast } from "sonner";
import { safe } from "ts-safe";

interface MoveAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MoveAgentDialog({
  open,
  onOpenChange,
  onSuccess,
}: MoveAgentDialogProps) {
  const { departments } = useDepartments();
  const { movingAgentId, movingAgentName, closeMoveAgentDialog } =
    useAgentManagementStore();

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取选中的部门和小组
  const selectedDepartment = departments?.find(
    (d) => d.id === selectedDepartmentId,
  );
  const availableGroups = selectedDepartment?.groups || [];

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedGroupId(null); // 重置小组选择
  };

  const handleSubmit = async () => {
    if (!movingAgentId || !selectedDepartmentId) {
      toast.error("请选择一个部门");
      return;
    }

    setIsSubmitting(true);

    try {
      // 如果选中的部门有小组，必须选择一个小组
      // 如果选中的部门没有小组，将分配到"未分组"（groupId为null）
      const finalGroupId =
        availableGroups.length > 0 && !selectedGroupId
          ? availableGroups[0].id // 默认选择第一个小组
          : selectedGroupId;

      await safe(() =>
        fetch(`/api/agent/${movingAgentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId: finalGroupId }),
        }),
      )
        .ifOk(async (res) => {
          if (res.ok) {
            const data = await res.json();
            // 检查响应中的groupId是否更新成功
            if (
              data.groupId === finalGroupId ||
              (finalGroupId === null && data.groupId === null)
            ) {
              toast.success("AI员工已移动");
              onOpenChange(false);
              closeMoveAgentDialog();
              onSuccess?.();
              // 刷新部门列表缓存（更新计数）
              fetch("/api/department", { method: "GET" }).catch(() => {});
            } else {
              throw new Error("Failed to update groupId");
            }
          } else {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to move agent");
          }
        })
        .ifFail((e) => {
          handleErrorWithToast(e);
          toast.error("移动失败，请重试");
          throw e;
        })
        .watch(() => setIsSubmitting(false));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>移动AI员工</DialogTitle>
          <DialogDescription>
            将 "{movingAgentName}" 移动到其他部门或小组
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 选择部门 */}
          <div className="space-y-2">
            <Label htmlFor="department">选择部门</Label>
            <Select
              value={selectedDepartmentId || ""}
              onValueChange={handleDepartmentChange}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="选择部门" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <span className="flex items-center gap-2">
                      <span>{dept.icon}</span>
                      <span>{dept.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({dept.agentCount} 个AI员工)
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 选择小组 */}
          {selectedDepartment && availableGroups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="group">选择小组</Label>
              <Select
                value={selectedGroupId || ""}
                onValueChange={setSelectedGroupId}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="选择小组" />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <span className="flex items-center gap-2">
                        <span>{group.icon}</span>
                        <span>{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({group.agentCount} 个AI员工)
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 未分配提示 */}
          {selectedDepartment && availableGroups.length === 0 && (
            <div className="text-sm text-muted-foreground">
              该部门暂无小组，AI员工将分配到部门的"未分组"
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              closeMoveAgentDialog();
            }}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "移动中..." : "确认移动"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
