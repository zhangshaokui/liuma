"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Copy, Loader2, MinusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { appStore } from "@/app/store";
import { ChatMention } from "app-types/chat";
import { cn } from "lib/utils";
import { format } from "date-fns";
import { generateUUID } from "lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Badge } from "ui/badge";

interface TemplateCardProps {
  template: any;
  userId: string;
  userRole?: string | null;
}

export function TemplateCard({ template, userId, userRole }: TemplateCardProps) {
  const router = useRouter();
  const [isCopying, setIsCopying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const isAdmin = userRole === 'admin';
  const t = useTranslations();

  const handleCopyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCopying(true);

    try {
      const response = await fetch("/api/agent-templates/" + template.id + "/copy", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to copy template");
      }

      const data = await response.json();
      toast.success("模板已复制，正在跳转...");
      router.push("/agent/" + data.id);
    } catch (error) {
      toast.error("复制模板失败");
    } finally {
      setIsCopying(false);
    }
  };

  const handleRemoveFromMarket = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);

    try {
      const response = await fetch("/api/agent/" + template.id, {
        method: "PUT",
        body: JSON.stringify({
          isTemplate: false,
          categoryId: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove from market");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success("已从人才市场移除");
      // 刷新页面以更新列表
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "移除失败");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCardClick = () => {
    const newMention: ChatMention = {
      type: "agent",
      agentId: template.id,
      name: template.name,
      icon: template.icon,
      description: template.description,
    };

    // Always create a new thread and navigate to it
    const newThreadId = generateUUID();
    appStore.setState(() => ({
      threadMentions: {
        [newThreadId]: [newMention],
      },
    }));
    router.push(`/chat/${newThreadId}`);
  };

  return (
    <Card
      className="w-full min-h-[196px] @container transition-colors group flex flex-col gap-3 cursor-pointer hover:bg-input"
      onClick={handleCardClick}
      data-testid="template-card"
      data-item-name={template.name}
      data-item-id={template.id}
    >
      <CardHeader className="shrink gap-y-0 relative">
        {template.copyCount > 0 && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-xs px-2 py-0.5"
          >
            {formatCopyCount(template.copyCount)} {t("AgentStore.copy")}
          </Badge>
        )}
        <CardTitle className="flex gap-3 items-stretch min-w-0 pr-16">
          <div
            style={{ backgroundColor: template.icon?.style?.backgroundColor }}
            className="p-2 rounded-lg flex items-center justify-center ring ring-background border shrink-0"
          >
            <Avatar className="size-6">
              <AvatarImage src={template.icon?.value} />
              <AvatarFallback>{template.coverEmoji || "🤖"}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col justify-around min-w-0 flex-1 overflow-hidden">
            <span className="truncate font-medium">{template.name}</span>
            <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
              <time className="shrink-0">
                {format(template.updatedAt || new Date(), "MMM d, yyyy")}
              </time>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="min-h-0 grow">
        <p className="text-xs line-clamp-3 break-words overflow-hidden text-muted-foreground">
          {template.description || "暂无描述"}
        </p>
      </CardContent>

      <CardFooter className="shrink min-h-0 overflow-visible">
        <div className="flex items-center gap-2 w-full min-w-0 justify-end">
          {template.categoryEmoji && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {template.categoryEmoji} {template.categoryName}
            </div>
          )}

          {isAdmin ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemoveFromMarket}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MinusCircle className="size-4" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={handleCopyClick}
              disabled={isCopying}
            >
              <Copy className={cn("size-4", isCopying && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function formatCopyCount(count: number | null | undefined): string {
  if (!count) return "0";
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}
