"use client";

import { useTranslations } from "next-intl";
import { AgentSummary, AgentUpdateSchema } from "app-types/agent";
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BackgroundPaths } from "ui/background-paths";
import { useMutateAgents } from "@/hooks/queries/use-agents";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "lib/utils";
import { Visibility } from "@/components/shareable-actions";
import { ShareableCard } from "@/components/shareable-card";
import { notify } from "lib/notify";
import { useState } from "react";
import { handleErrorWithToast } from "ui/shared-toast";
import { safe } from "ts-safe";
import { canCreateAgent } from "lib/auth/client-permissions";
import { AddToStoreDialog } from "@/components/agent/add-to-store-dialog";

interface AgentsListProps {
  userId: string;
  userRole?: string | null;
}

export function AgentsList({
  userId,
  userRole,
}: AgentsListProps) {
  const t = useTranslations();
  const mutateAgents = useMutateAgents();
  const [deletingAgentLoading, setDeletingAgentLoading] = useState<
    string | null
  >(null);
  const [isAddToStoreDialogOpen, setIsAddToStoreDialogOpen] = useState(false);
  const [selectedAgentForStore, setSelectedAgentForStore] = useState<{id: string, name: string} | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [visibilityChangeLoading, setVisibilityChangeLoading] = useState<
    string | null
  >(null);

  const { data: allAgents, isLoading } = useSWR<AgentSummary[]>(
    `/api/agent?filters=mine&key=${refreshKey}`,
    fetcher,
  );

  const myAgents: AgentSummary[] = allAgents || [];

  // Don't render anything while loading to avoid flash
  if (isLoading && !allAgents) {
    return null;
  }

  const updateVisibility = async (agentId: string, visibility: Visibility) => {
    safe(() => setVisibilityChangeLoading(agentId))
      .map(() => AgentUpdateSchema.parse({ visibility }))
      .map(JSON.stringify)
      .map(async (body) =>
        fetcher(`/api/agent/${agentId}`, {
          method: "PUT",
          body,
        }),
      )
      .ifOk(() => {
        mutateAgents({ id: agentId, visibility });
        toast.success(t("Agent.visibilityUpdated"));
      })
      .ifFail((e) => {
        handleErrorWithToast(e);
        toast.error(t("Common.error"));
      })
      .watch(() => setVisibilityChangeLoading(null));
  };

  const deleteAgent = async (agentId: string) => {
    const ok = await notify.confirm({
      title: t("Common.delete"),
      description: t("Agent.deleteConfirm"),
    });
    if (!ok) return;
    safe(() => setDeletingAgentLoading(agentId))
      .map(() =>
        fetcher(`/api/agent/${agentId}`, {
          method: "DELETE",
        }),
      )
      .ifOk(() => {
        mutateAgents({ id: agentId }, true);
        toast.success(t("Agent.deleted"));
      })
      .ifFail((e) => {
        handleErrorWithToast(e);
        toast.error(t("Common.error"));
      })
      .watch(() => setDeletingAgentLoading(null));
  };

  // Check if user can create agents using Better Auth permissions
  const canCreate = canCreateAgent(userRole);
  const isAdmin = userRole === 'admin';

  return (
    <div className="w-full flex flex-col gap-4 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" data-testid="agents-title">
          {t("Layout.agents")}
        </h1>
        {canCreate && (
          <Link href="/agent/new">
            <Button variant="ghost" data-testid="create-agent-button">
              <Plus />
              {t("Agent.newAgent")}
            </Button>
          </Link>
        )}
      </div>

      {/* My Agents Section */}
      {canCreate && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {canCreate && (
              <Link href="/agent/new">
                <Card
                  className="relative bg-secondary overflow-hidden cursor-pointer hover:bg-input transition-colors h-[196px]"
                  data-testid="create-agent-card"
                >
                  <div className="absolute inset-0 w-full h-full opacity-50">
                    <BackgroundPaths />
                  </div>
                  <CardHeader>
                    <CardTitle>
                      <h1 className="text-lg font-bold">
                        {t("Agent.newAgent")}
                      </h1>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <p>{t("Layout.createYourOwnAgent")}</p>
                    </CardDescription>
                    <div className="mt-auto ml-auto flex-1">
                      <Button variant="ghost" size="lg">
                        {t("Common.create")}
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {myAgents.map((agent) => (
              <ShareableCard
                key={agent.id}
                type="agent"
                item={agent}
                href={`/agent/${agent.id}`}
                onVisibilityChange={updateVisibility}
                isVisibilityChangeLoading={visibilityChangeLoading === agent.id}
                isDeleteLoading={deletingAgentLoading === agent.id}
                onDelete={deleteAgent}
                hideVisibilityAndBookmark={true}
                onAddToStore={
                  isAdmin
                    ? () => {
                        setSelectedAgentForStore({ id: agent.id, name: agent.name });
                        setIsAddToStoreDialogOpen(true);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {isAddToStoreDialogOpen && selectedAgentForStore && (
        <AddToStoreDialog
          agentId={selectedAgentForStore!.id}
          agentName={selectedAgentForStore!.name}
          open={isAddToStoreDialogOpen}
          onOpenChange={setIsAddToStoreDialogOpen}
          onAdded={() => {
            setIsAddToStoreDialogOpen(false);
            setSelectedAgentForStore(null);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
