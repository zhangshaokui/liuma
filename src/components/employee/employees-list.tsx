"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEmployeeActions } from "@/hooks/queries/use-employee-actions";
import { toast } from "sonner";
import { handleErrorWithToast } from "ui/shared-toast";
import { useState, useCallback } from "react";
import { appStore } from "@/app/store";
import { ChatMention } from "app-types/chat";
import { UserMinus } from "lucide-react";
import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { Loader2 } from "lucide-react";
import { generateUUID } from "lib/utils";

interface EmployeeAgent {
  id: string;
  name: string;
  description: string | null;
  icon: any;
  visibility: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeesListProps {
  initialEmployees: EmployeeAgent[];
  userId: string;
}

export function EmployeesList({
  initialEmployees,
  userId,
}: EmployeesListProps) {
  const router = useRouter();
  const [removingAgentLoading, setRemovingAgentLoading] = useState<
    string | null
  >(null);
  const [employees, setEmployees] = useState(initialEmployees);

  const { removeEmployee, isLoading: isEmployeeLoading } = useEmployeeActions();

  const removeEmployeeAction = async (agentId: string) => {
    setRemovingAgentLoading(agentId);
    try {
      await removeEmployee(agentId);
      toast.success("已移出员工列表");
      // Remove from local state to refresh the UI
      setEmployees((prev) => prev.filter((agent) => agent.id !== agentId));
      // Also refresh the server component
      router.refresh();
    } catch (err) {
      handleErrorWithToast(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setRemovingAgentLoading(null);
    }
  };

  const handleEmployeeClick = useCallback(
    (agent: EmployeeAgent) => {
      const newMention: ChatMention = {
        type: "agent",
        agentId: agent.id,
        name: agent.name,
        icon: agent.icon,
        description: agent.description,
      };

      // Always create a new thread and navigate to it
      const newThreadId = generateUUID();
      appStore.setState(() => ({
        threadMentions: {
          [newThreadId]: [newMention],
        },
      }));
      router.push(`/chat/${newThreadId}`);
    },
    [router],
  );

  return (
    <div className="w-full flex flex-col gap-4 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI员工</h1>
      </div>

      {/* Employees Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">我的员工</h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {employees.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleEmployeeClick(agent)}
                className="cursor-pointer"
              >
                <div
                  className="w-full min-h-[196px] @container transition-colors group flex flex-col gap-3 hover:bg-input border rounded-lg p-6"
                >
                  <div className="shrink gap-y-0">
                    <div className="flex gap-3 items-stretch min-w-0">
                      <div
                        style={{
                          backgroundColor: agent.icon?.style?.backgroundColor,
                        }}
                        className="p-2 rounded-lg flex items-center justify-center ring ring-background border shrink-0"
                      >
                        <div className="size-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {agent.name[0]?.toUpperCase()}
                        </div>
                      </div>

                      <div className="flex flex-col justify-around min-w-0 flex-1 overflow-hidden">
                        <span className="truncate font-medium text-sm">
                          {agent.name}
                        </span>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                          <time className="shrink-0">
                            {format(agent.updatedAt || new Date(), "MMM d, yyyy")}
                          </time>
                        </div>
                      </div>

                      {/* Remove Employee Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                            disabled={isEmployeeLoading(agent.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEmployeeAction(agent.id);
                            }}
                          >
                            {removingAgentLoading === agent.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <UserMinus className="size-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>移出员工列表</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <p className="text-xs line-clamp-3 break-words overflow-hidden text-muted-foreground">
                    {agent.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-transparent border-none rounded-lg text-center py-12">
            <h3 className="text-lg font-semibold mb-2">暂无AI员工</h3>
            <p className="text-sm text-muted-foreground">
              从智能体列表中选择智能体添加为您的员工
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
