"use client";

import { TemplateCard } from "./template-card";
import { NewAgentCard } from "./new-agent-card";
import { Skeleton } from "ui/skeleton";

interface TemplateGridProps {
  templates: any[];
  isLoading: boolean;
  userId: string;
  userRole?: string | null;
}

export function TemplateGrid({
  templates,
  isLoading,
  userId,
  userRole,
}: TemplateGridProps) {
  const isAdmin = userRole === "admin";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0 && !isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无智能体模板</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Admin: New Agent Card */}
      {isAdmin && <NewAgentCard />}

      {/* Templates */}
      {templates.length === 0 && isAdmin ? (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">暂无智能体模板</p>
        </div>
      ) : (
        templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            userId={userId}
            userRole={userRole}
          />
        ))
      )}
    </div>
  );
}
