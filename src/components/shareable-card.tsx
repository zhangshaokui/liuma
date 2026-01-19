"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { cn } from "lib/utils";
import { ShareableActions, type Visibility } from "./shareable-actions";
import { WorkflowSummary } from "app-types/workflow";
import { AgentSummary } from "app-types/agent";
import { MCPServerInfo } from "app-types/mcp";
import { MCPIcon } from "ui/mcp-icon";
import Link from "next/link";
import { ComponentType, ReactNode } from "react";

export interface ShareableIcon {
  value?: string;
  style?: {
    backgroundColor?: string;
  };
}

interface ShareableCardProps {
  type: "agent" | "workflow" | "mcp";
  item: AgentSummary | WorkflowSummary | MCPServerInfo;
  isOwner?: boolean;
  href: string;
  visibility?: Visibility;
  isBookmarked?: boolean;
  onBookmarkToggle?: (itemId: string, isBookmarked: boolean) => void;
  onVisibilityChange?: (itemId: string, visibility: Visibility) => void;
  onDelete?: (itemId: string) => void;
  isBookmarkToggleLoading?: boolean;
  isVisibilityChangeLoading?: boolean;
  isDeleteLoading?: boolean;
  actionsDisabled?: boolean;
  isEmployee?: boolean;
  onEmployeeToggle?: (itemId: string, isEmployee: boolean) => void;
  isEmployeeToggleLoading?: boolean;
  hideVisibilityAndBookmark?: boolean;
  onAddToStore?: () => void;
  onMove?: () => void;
  onCardClick?: () => void;
  AddToStoreDialog?: ComponentType<{
    agentId: string;
    agentName: string;
    onAdded?: () => void;
  }>;
  extraContent?: ReactNode;
  departmentInfo?: {
    departmentName?: string;
    groupName?: string;
  };
}

export function ShareableCard({
  type,
  item,
  isOwner = true,
  href,
  visibility,
  onBookmarkToggle,
  onVisibilityChange,
  onDelete,
  isBookmarkToggleLoading,
  isVisibilityChangeLoading,
  isDeleteLoading,
  actionsDisabled,
  isEmployee = false,
  onEmployeeToggle,
  isEmployeeToggleLoading = false,
  hideVisibilityAndBookmark = false,
  onAddToStore,
  onMove,
  onCardClick,
  AddToStoreDialog: _AddToStoreDialog,
  extraContent,
  departmentInfo,
}: ShareableCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isPublished = (item as WorkflowSummary).isPublished;
  const isBookmarked =
    type === "mcp" ? undefined : (item as AgentSummary).isBookmarked;

  // Format date based on locale
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (locale === "zh") {
      return format(dateObj, "yyyy.MM.dd");
    } else {
      return format(dateObj, "MMM d, yyyy");
    }
  };

  return (
    <>
      {onCardClick ? (
        <Card
          onClick={onCardClick}
          className={cn(
            "w-full min-h-[196px] @container transition-colors group flex flex-col gap-3 cursor-pointer hover:bg-input",
          )}
          data-testid={`${type}-card`}
          data-item-name={item.name}
          data-item-id={item.id}
        >
          <CardHeader className="shrink gap-y-0">
            <CardTitle className="flex gap-3 items-stretch min-w-0">
              <div
                style={{ backgroundColor: item.icon?.style?.backgroundColor }}
                className="p-2 rounded-lg flex items-center justify-center ring ring-background border shrink-0"
              >
                {type === "mcp" ? (
                  <MCPIcon className="fill-white size-6" />
                ) : (
                  <Avatar className="size-6">
                    <AvatarImage src={item.icon?.value} />
                    <AvatarFallback />
                  </Avatar>
                )}
              </div>

              <div className="flex flex-col justify-around min-w-0 flex-1 overflow-hidden">
                <span
                  className="truncate font-medium"
                  data-testid={`${type}-card-name`}
                >
                  {item.name}
                </span>
                <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                  <time className="shrink-0">
                    {formatDate(item.updatedAt || new Date())}
                  </time>
                  {type === "workflow" && !isPublished && (
                    <span className="px-2 rounded-sm bg-secondary text-foreground shrink-0">
                      {t("Workflow.draft")}
                    </span>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="min-h-0 grow">
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <CardDescription className="text-xs line-clamp-3 break-words overflow-hidden">
                  {item.description}
                </CardDescription>
              </div>
              {departmentInfo &&
                (departmentInfo.departmentName || departmentInfo.groupName) && (
                  <div className="flex-shrink-0 text-xs text-muted-foreground text-right max-w-[120px]">
                    <div className="line-clamp-2">
                      <div>{departmentInfo.departmentName || "-"}</div>
                      {departmentInfo.groupName && (
                        <div className="text-muted-foreground/70">
                          / {departmentInfo.groupName}
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>

          <CardFooter className="shrink min-h-0 overflow-visible">
            <div className="flex items-center gap-2 w-full min-w-0">
              {!isOwner && item.userName && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar className="size-4 ring shrink-0 rounded-full">
                    <AvatarImage src={item.userAvatar || undefined} />
                    <AvatarFallback>
                      {item.userName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground font-medium truncate min-w-0">
                    {item.userName}
                  </span>
                </div>
              )}

              <div className="ml-auto">
                <ShareableActions
                  type={type}
                  visibility={visibility}
                  isOwner={isOwner}
                  isBookmarked={isBookmarked}
                  editHref={href}
                  onVisibilityChange={
                    onVisibilityChange
                      ? (visibility) => onVisibilityChange(item.id, visibility)
                      : undefined
                  }
                  onBookmarkToggle={
                    onBookmarkToggle
                      ? (isBookmarked) =>
                          onBookmarkToggle(item.id, isBookmarked)
                      : undefined
                  }
                  onDelete={onDelete ? () => onDelete(item.id) : undefined}
                  isBookmarkToggleLoading={isBookmarkToggleLoading}
                  isVisibilityChangeLoading={isVisibilityChangeLoading}
                  isDeleteLoading={isDeleteLoading}
                  disabled={actionsDisabled}
                  isEmployee={isEmployee}
                  onEmployeeToggle={
                    onEmployeeToggle
                      ? (isEmployee) => onEmployeeToggle(item.id, isEmployee)
                      : undefined
                  }
                  isEmployeeToggleLoading={isEmployeeToggleLoading}
                  hideVisibilityAndBookmark={hideVisibilityAndBookmark}
                  onAddToStore={onAddToStore}
                  onMove={onMove}
                />
              </div>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Link href={href} title={item.name}>
          <Card
            className={cn(
              "w-full min-h-[196px] @container transition-colors group flex flex-col gap-3 cursor-pointer hover:bg-input",
            )}
            data-testid={`${type}-card`}
            data-item-name={item.name}
            data-item-id={item.id}
          >
            <CardHeader className="shrink gap-y-0">
              <CardTitle className="flex gap-3 items-stretch min-w-0">
                <div
                  style={{ backgroundColor: item.icon?.style?.backgroundColor }}
                  className="p-2 rounded-lg flex items-center justify-center ring ring-background border shrink-0"
                >
                  {type === "mcp" ? (
                    <MCPIcon className="fill-white size-6" />
                  ) : (
                    <Avatar className="size-6">
                      <AvatarImage src={item.icon?.value} />
                      <AvatarFallback />
                    </Avatar>
                  )}
                </div>

                <div className="flex flex-col justify-around min-w-0 flex-1 overflow-hidden">
                  <span
                    className="truncate font-medium"
                    data-testid={`${type}-card-name`}
                  >
                    {item.name}
                  </span>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                    <time className="shrink-0">
                      {formatDate(item.updatedAt || new Date())}
                    </time>
                    {type === "workflow" && !isPublished && (
                      <span className="px-2 rounded-sm bg-secondary text-foreground shrink-0">
                        {t("Workflow.draft")}
                      </span>
                    )}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="min-h-0 grow">
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <CardDescription className="text-xs line-clamp-3 break-words overflow-hidden">
                    {item.description}
                  </CardDescription>
                </div>
                {departmentInfo &&
                  (departmentInfo.departmentName ||
                    departmentInfo.groupName) && (
                    <div className="flex-shrink-0 text-xs text-muted-foreground text-right max-w-[120px]">
                      <div className="line-clamp-2">
                        <div>{departmentInfo.departmentName || "-"}</div>
                        {departmentInfo.groupName && (
                          <div className="text-muted-foreground/70">
                            / {departmentInfo.groupName}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>

            <CardFooter className="shrink min-h-0 overflow-visible">
              <div className="flex items-center gap-2 w-full min-w-0">
                {!isOwner && item.userName && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Avatar className="size-4 ring shrink-0 rounded-full">
                      <AvatarImage src={item.userAvatar || undefined} />
                      <AvatarFallback>
                        {item.userName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground font-medium truncate min-w-0">
                      {item.userName}
                    </span>
                  </div>
                )}

                <div className="ml-auto">
                  <ShareableActions
                    type={type}
                    visibility={visibility}
                    isOwner={isOwner}
                    isBookmarked={isBookmarked}
                    editHref={href}
                    onVisibilityChange={
                      onVisibilityChange
                        ? (visibility) =>
                            onVisibilityChange(item.id, visibility)
                        : undefined
                    }
                    onBookmarkToggle={
                      onBookmarkToggle
                        ? (isBookmarked) =>
                            onBookmarkToggle(item.id, isBookmarked)
                        : undefined
                    }
                    onDelete={onDelete ? () => onDelete(item.id) : undefined}
                    isBookmarkToggleLoading={isBookmarkToggleLoading}
                    isVisibilityChangeLoading={isVisibilityChangeLoading}
                    isDeleteLoading={isDeleteLoading}
                    disabled={actionsDisabled}
                    isEmployee={isEmployee}
                    onEmployeeToggle={
                      onEmployeeToggle
                        ? (isEmployee) => onEmployeeToggle(item.id, isEmployee)
                        : undefined
                    }
                    isEmployeeToggleLoading={isEmployeeToggleLoading}
                    hideVisibilityAndBookmark={hideVisibilityAndBookmark}
                    onAddToStore={onAddToStore}
                    onMove={onMove}
                  />
                </div>
              </div>
            </CardFooter>
          </Card>
        </Link>
      )}

      {extraContent}
    </>
  );
}
