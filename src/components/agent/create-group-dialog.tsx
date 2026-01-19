"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { useAgentGroupMutations } from "@/hooks/queries/use-agent-groups";
import { useDepartments } from "@/hooks/queries/use-departments";
import { handleErrorWithToast } from "ui/shared-toast";
import { toast } from "sonner";
import { safe } from "ts-safe";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDepartmentId?: string;
  onSuccess?: () => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  defaultDepartmentId,
  onSuccess,
}: CreateGroupDialogProps) {
  const { editingGroup, closeEditGroupDialog } = useAgentManagementStore();
  const { departments } = useDepartments();
  const { createGroup, updateGroup } = useAgentGroupMutations();

  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState<string | null>(
    defaultDepartmentId || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!editingGroup;

  useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name);
      setDepartmentId(editingGroup.departmentId);
    } else {
      setName("");
      setDepartmentId(defaultDepartmentId || null);
    }
  }, [editingGroup, defaultDepartmentId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("请输入小组名称");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && editingGroup) {
        await safe(() =>
          updateGroup(editingGroup.id, {
            name: name.trim(),
            departmentId,
          }),
        )
          .ifOk(() => {
            toast.success("小组已更新");
            onOpenChange(false);
            closeEditGroupDialog();
            onSuccess?.();
          })
          .ifFail((e) => {
            handleErrorWithToast(e);
            throw e;
          })
          .watch(() => setIsSubmitting(false));
      } else {
        await safe(() =>
          createGroup({
            name: name.trim(),
            icon: "📁",
            color: "#94a3b8",
            departmentId,
            type: "custom",
          }),
        )
          .ifOk(() => {
            toast.success("小组已创建");
            onOpenChange(false);
            onSuccess?.();
          })
          .ifFail((e) => {
            handleErrorWithToast(e);
            throw e;
          })
          .watch(() => setIsSubmitting(false));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑小组" : "新建小组"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改小组信息" : "创建一个新的小组来组织你的AI员工"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 小组名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              小组名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="例如：品牌推广组、前端组"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 所属部门 */}
          {departments && departments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="department">所属部门</Label>
              <Select
                value={departmentId || ""}
                onValueChange={(value) => setDepartmentId(value || null)}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      <span className="flex items-center gap-2">
                        <span>{dept.icon}</span>
                        <span>{dept.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              closeEditGroupDialog();
            }}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : isEdit ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
