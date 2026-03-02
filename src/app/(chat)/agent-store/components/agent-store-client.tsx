"use client";

import { useState } from "react";
import { TemplateSearch } from "./template-search";
import { CategoryTabs } from "./category-tabs";
import { TemplateGrid } from "./template-grid";
import { useTemplates } from "@/hooks/queries/use-templates";
import type { AgentCategory } from "app-types/agent";
import { useTranslations } from "next-intl";

interface AgentStoreClientProps {
  userId: string;
  userRole?: string | null;
  initialCategories: AgentCategory[];
}

export function AgentStoreClient({
  userId,
  userRole,
  initialCategories,
}: AgentStoreClientProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch templates with filters
  const { templates, isLoading } = useTemplates({
    search: searchQuery,
    category: selectedCategory,
  });

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("Layout.agentStore")}</h1>
        <p className="text-muted-foreground">
          浏览并复制官方智能体模板，快速开始使用
        </p>
      </div>

      {/* Search Bar */}
      <TemplateSearch
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {/* Category Tabs */}
      <CategoryTabs
        categories={initialCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Templates Grid */}
      <TemplateGrid
        templates={templates || []}
        isLoading={isLoading}
        userId={userId}
        userRole={userRole}
      />
    </div>
  );
}
