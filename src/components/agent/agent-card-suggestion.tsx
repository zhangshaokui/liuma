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
        "transition-colors group flex flex-col gap-3 cursor-pointer hover:bg-input border-border/50",
        "w-[calc(33.333%-0.375rem)] shrink-0" // 每行3个，减去gap的一半
      )}
      data-testid="agent-suggestion-card"
      data-item-name={agent.name}
      data-item-id={agent.id}
      onClick={() => onClick(agent)}
    >
      <CardHeader className="shrink gap-y-0 p-3">
        <CardTitle className="flex gap-2 items-start min-w-0">
          <div
            style={{ backgroundColor: agent.icon?.style?.backgroundColor }}
            className="p-1.5 rounded-md flex items-center justify-center ring ring-background border shrink-0"
          >
            <Avatar className="size-5">
              <AvatarImage src={agent.icon?.value} />
              <AvatarFallback />
            </Avatar>
          </div>

          <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
            <span
              className="font-medium text-sm leading-tight break-words"
              data-testid="agent-suggestion-name"
            >
              {agent.name}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
