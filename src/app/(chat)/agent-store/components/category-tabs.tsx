"use client";

import { Button } from "ui/button";
import type { AgentCategory } from "app-types/agent";

interface CategoryTabsProps {
  categories: AgentCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {/* 全部 */}
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className="whitespace-nowrap"
      >
        全部
      </Button>

      {/* 分类列表 */}
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className="whitespace-nowrap"
        >
          {category.emoji} {category.name}
        </Button>
      ))}
    </div>
  );
}
