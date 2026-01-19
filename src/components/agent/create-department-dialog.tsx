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
import { useAgentManagementStore } from "@/app/store/agent-management.store";
import { useDepartmentMutations } from "@/hooks/queries/use-departments";
import { handleErrorWithToast } from "ui/shared-toast";
import { toast } from "sonner";
import { safe } from "ts-safe";

interface CreateDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateDepartmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateDepartmentDialogProps) {
  const { editingDepartment, closeEditDepartmentDialog } =
    useAgentManagementStore();
  const { createDepartment, updateDepartment } = useDepartmentMutations();

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!editingDepartment;

  useEffect(() => {
    if (editingDepartment) {
      setName(editingDepartment.name);
    } else {
      setName("");
    }
  }, [editingDepartment]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("请输入部门名称");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && editingDepartment) {
        await safe(() =>
          updateDepartment(editingDepartment.id, {
            name: name.trim(),
          }),
        )
          .ifOk(() => {
            toast.success("部门已更新");
            onOpenChange(false);
            closeEditDepartmentDialog();
            onSuccess?.();
          })
          .ifFail((e) => {
            handleErrorWithToast(e);
            throw e;
          })
          .watch(() => setIsSubmitting(false));
      } else {
        await safe(() =>
          createDepartment({
            name: name.trim(),
            icon: "🏢",
            color: "#3b82f6",
          }),
        )
          .ifOk(() => {
            toast.success("部门已创建");
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
          <DialogTitle>{isEdit ? "编辑部门" : "新建部门"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改部门信息" : "创建一个新的部门来组织你的AI员工"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 部门名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              部门名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="例如：市场部、技术部"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              closeEditDepartmentDialog();
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
