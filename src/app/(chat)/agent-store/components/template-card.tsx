"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { appStore } from "@/app/store";
import { ChatMention } from "app-types/chat";
import { cn } from "lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

interface TemplateCardProps {
  template: any;
  userId: string;
  userRole?: string | null;
}

export function TemplateCard({ template, userId, userRole }: TemplateCardProps) {
  const router = useRouter();
  const [isCopying, setIsCopying] = useState(false);

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

  const handleCardClick = () => {
    const newMention: ChatMention = {
      type: "agent",
      agentId: template.id,
      name: template.name,
      icon: template.icon,
      description: template.description,
    };

    const currentThreadId = appStore.getState().currentThreadId;

    if (currentThreadId) {
      appStore.setState((prev) => {
        const currentMentions = prev.threadMentions[currentThreadId] || [];
        const target = currentMentions.find(
          (mention) => mention.type == "agent" && mention.agentId === template.id,
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
  };

  return (
    <Card
      className="w-full min-h-[196px] @container transition-colors group flex flex-col gap-3 cursor-pointer hover:bg-input"
      onClick={handleCardClick}
      data-testid="template-card"
      data-item-name={template.name}
      data-item-id={template.id}
    >
      <CardHeader className="shrink gap-y-0">
        <CardTitle className="flex gap-3 items-stretch min-w-0">
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
              {template.copyCount > 0 && (
                <span className="flex items-center gap-1">
                  <span>{formatCopyCount(template.copyCount)} 复制</span>
                </span>
              )}
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
        <div className="flex items-center justify-between w-full min-w-0">
          {template.categoryEmoji && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {template.categoryEmoji} {template.categoryName}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopyClick}
            disabled={isCopying}
          >
            <Copy className={cn("size-4", isCopying && "animate-spin")} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function formatCopyCount(count: number | null | undefined): string {
  if (!count) return "0";
  if (count >= 10000) return (count / 10000).toFixed(1) + "万";
  if (count >= 1000) return (count / 1000).toFixed(1) + "k";
  return count.toString();
}
