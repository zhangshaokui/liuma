import { eq } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { AgentCategoryTable } from "../schema.pg";

export interface AgentCategoryRepository {
  getAllCategories(): Promise<Array<{id: string, name: string, emoji: string, sortOrder: number}>>;
  getCategoryById(id: string): Promise<{id: string, name: string, emoji: string, sortOrder: number} | null>;
  createCategory(name: string, emoji: string, sortOrder: number): Promise<{id: string, name: string, emoji: string, sortOrder: number}>;
  updateCategory(id: string, name: string, emoji: string, sortOrder: number): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  initializeDefaultCategories(): Promise<void>;
}

export const pgAgentCategoryRepository: AgentCategoryRepository = {
  async getAllCategories() {
    const categories = await db
      .select()
      .from(AgentCategoryTable)
      .orderBy(AgentCategoryTable.sortOrder);

    return categories.map(c => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      sortOrder: c.sortOrder,
    }));
  },

  async getCategoryById(id) {
    const [category] = await db
      .select()
      .from(AgentCategoryTable)
      .where(eq(AgentCategoryTable.id, id))
      .limit(1);

    return category ? {
      id: category.id,
      name: category.name,
      emoji: category.emoji,
      sortOrder: category.sortOrder,
    } : null;
  },

  async createCategory(name, emoji, sortOrder) {
    const [category] = await db
      .insert(AgentCategoryTable)
      .values({
        name,
        emoji,
        sortOrder,
      })
      .returning();

    return {
      id: category.id,
      name: category.name,
      emoji: category.emoji,
      sortOrder: category.sortOrder,
    };
  },

  async updateCategory(id, name, emoji, sortOrder) {
    await db
      .update(AgentCategoryTable)
      .set({ name, emoji, sortOrder })
      .where(eq(AgentCategoryTable.id, id));
  },

  async deleteCategory(id) {
    await db
      .delete(AgentCategoryTable)
      .where(eq(AgentCategoryTable.id, id));
  },

  async initializeDefaultCategories() {
    const existing = await this.getAllCategories();
    if (existing.length > 0) {
      return; // Already initialized
    }

    await this.createCategory("全部", "📋", 0);
    await this.createCategory("营销", "📢", 1);
    await this.createCategory("法务", "⚖️", 2);
    await this.createCategory("产品", "📦", 3);
    await this.createCategory("规划", "🎯", 4);
    await this.createCategory("人事", "👥", 5);
  },
};
