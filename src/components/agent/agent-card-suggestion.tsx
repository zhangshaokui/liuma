"use client";

import { Card, CardHeader, CardTitle } from "ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { cn } from "lib/utils";
import { AgentSummary } from "app-types/agent";

interface AgentCardSuggestionProps {
  agent: AgentSummary;
  onClick: (agent: AgentSummary) => void;
}

export function AgentCardSuggestion({
  agent,
  onClick,
}: AgentCardSuggestionProps) {
  return (
    <Card
      className={cn(
        "w-full min-h-[196px] transition-colors group flex flex-col gap-3 cursor-pointer hover:bg-input",
        "flex-shrink-0 w-48" // 固定宽度，确保显示一致
      )}
      data-testid="agent-suggestion-card"
      data-item-name={agent.name}
      data-item-id={agent.id}
      onClick={() => onClick(agent)}
    >
      <CardHeader className="shrink gap-y-0">
        <CardTitle className="flex gap-3 items-stretch min-w-0">
          <div
            style={{ backgroundColor: agent.icon?.style?.backgroundColor }}
            className="p-2 rounded-lg flex items-center justify-center ring ring-background border shrink-0"
          >
            <Avatar className="size-6">
              <AvatarImage src={agent.icon?.value} />
              <AvatarFallback />
            </Avatar>
          </div>

          <div className="flex flex-col justify-around min-w-0 flex-1 overflow-hidden">
            <span
              className="truncate font-medium text-sm"
              data-testid="agent-suggestion-name"
            >
              {agent.name}
            </span>
            {agent.description && (
              <p className="text-xs text-muted-foreground truncate">
                {agent.description}
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
