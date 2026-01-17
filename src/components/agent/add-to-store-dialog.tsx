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
import { Label } from "ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { useCategories } from "@/hooks/queries/use-categories";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetcher } from "lib/utils";
import { handleErrorWithToast } from "ui/shared-toast";

interface AddToStoreDialogProps {
  agentId: string;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
  initialCategoryId?: string;
  isTemplate?: boolean;
}

export function AddToStoreDialog({
  agentId,
  agentName,
  open,
  onOpenChange,
  onAdded,
  initialCategoryId,
  isTemplate = false,
}: AddToStoreDialogProps) {
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId || "");
  const [isAdding, setIsAdding] = useState(false);

  const { categories = [], isLoading } = useCategories();

  useEffect(() => {
    if (open) {
      setCategoryId(initialCategoryId || "");
    }
  }, [open, initialCategoryId]);

  const handleAddToStore = async () => {
    if (!categoryId) {
      toast.error("请选择一个类别");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetcher(`/api/agent/${agentId}`, {
        method: "PUT",
        body: JSON.stringify({
          isTemplate: true,
          categoryId,
        }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(isTemplate ? "已更新智能体商店设置" : "已添加到智能体商店");
      onOpenChange(false);
      setCategoryId("");
      onAdded?.();
    } catch (error) {
      handleErrorWithToast(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isTemplate ? "编辑智能体商店设置" : "添加到智能体商店"}
          </DialogTitle>
          <DialogDescription>
            {isTemplate
              ? `修改 ${agentName} 在智能体商店中的类别`
              : `选择 ${agentName} 要添加到的类别`}
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">类别</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isLoading || isAdding}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="选择类别" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            取消
          </Button>
          <Button
            onClick={handleAddToStore}
            disabled={!categoryId || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                {isTemplate ? "更新中..." : "添加中..."}
              </>
            ) : (
              isTemplate ? "更新" : "添加"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
