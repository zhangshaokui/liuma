import { and, eq, desc, asc, ne, sql } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import {
  AgentGroupTable,
  AgentGroupMemberTable,
  AgentTable,
} from "../schema.pg";
import { generateUUID } from "lib/utils";

export interface AgentGroup {
  id: string;
  userId: string;
  departmentId: string | null;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  type: "system" | "custom";
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentGroupWithAgents extends AgentGroup {
  agentCount: number;
}

export interface AgentGroupRepository {
  // 组管理
  createGroup(
    userId: string,
    data: {
      name: string;
      departmentId?: string | null;
      color?: string;
      icon?: string;
      sortOrder?: number;
      type?: "system" | "custom";
    },
  ): Promise<AgentGroup>;

  updateGroup(
    groupId: string,
    userId: string,
    data: {
      name?: string;
      departmentId?: string | null;
      color?: string;
      icon?: string;
      sortOrder?: number;
    },
  ): Promise<AgentGroup>;

  getUserGroups(userId: string): Promise<AgentGroup[]>;
  getGroupsByDepartment(departmentId: string): Promise<AgentGroup[]>;

  deleteGroup(groupId: string, userId: string): Promise<void>;

  getGroupByName(userId: string, name: string): Promise<AgentGroup | null>;
  getGroupById(groupId: string): Promise<AgentGroup | null>;

  // 成员管理（保留旧的成员管理方法用于向后兼容）
  addMember(groupId: string, agentId: string): Promise<void>;
  removeMember(groupId: string, agentId: string): Promise<void>;
  getGroupAgents(groupId: string): Promise<Array<any>>;
  isAgentInGroup(groupId: string, agentId: string): Promise<boolean>;

  // 使用记录
  updateLastUsed(groupId: string, agentId: string): Promise<void>;

  // 系统组初始化
  initializeSystemGroups(userId: string): Promise<void>;

  // 更新时间戳
  updateTimestamp(groupId: string): Promise<void>;
}

export const pgAgentGroupRepository: AgentGroupRepository = {
  async createGroup(userId, data) {
    const [result] = await db
      .insert(AgentGroupTable)
      .values({
        id: generateUUID(),
        userId,
        name: data.name,
        departmentId: data.departmentId ?? null,
        color: data.color || "#94a3b8",
        icon: data.icon || "📁",
        sortOrder: data.sortOrder || 0,
        type: data.type || "custom",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result;
  },

  async updateGroup(groupId, userId, data) {
    const [result] = await db
      .update(AgentGroupTable)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.departmentId !== undefined && {
          departmentId: data.departmentId,
        }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(AgentGroupTable.id, groupId),
          eq(AgentGroupTable.userId, userId),
        ),
      )
      .returning();

    return result;
  },

  async getUserGroups(userId) {
    const groups = await db
      .select()
      .from(AgentGroupTable)
      .where(eq(AgentGroupTable.userId, userId))
      .orderBy(asc(AgentGroupTable.sortOrder), desc(AgentGroupTable.createdAt));

    return groups;
  },

  async getGroupsByDepartment(departmentId) {
    const groups = await db
      .select()
      .from(AgentGroupTable)
      .where(eq(AgentGroupTable.departmentId, departmentId))
      .orderBy(asc(AgentGroupTable.sortOrder), desc(AgentGroupTable.createdAt));

    return groups;
  },

  async deleteGroup(groupId, userId) {
    const result = await db
      .delete(AgentGroupTable)
      .where(
        and(
          eq(AgentGroupTable.id, groupId),
          eq(AgentGroupTable.userId, userId),
          eq(AgentGroupTable.type, "custom"), // 只能删除自定义组
          ne(AgentGroupTable.name, "未分组"), // 不允许删除默认的"未分组"组
        ),
      )
      .returning();

    // 检查是否真的删除了行
    if (result.length === 0) {
      // 先检查小组是否存在，以提供更准确的错误信息
      const group = await this.getGroupById(groupId);
      if (!group) {
        throw new Error("小组不存在");
      }
      if (group.type !== "custom") {
        throw new Error("系统组不能删除");
      }
      if (group.name === "未分组") {
        throw new Error("未分组小组不能删除");
      }
      if (group.userId !== userId) {
        throw new Error("无权限删除此小组");
      }
      // 如果以上检查都通过但没删除，可能是其他原因
      throw new Error("删除失败：无法删除该小组");
    }
  },

  async getGroupByName(userId, name) {
    const [group] = await db
      .select()
      .from(AgentGroupTable)
      .where(
        and(eq(AgentGroupTable.userId, userId), eq(AgentGroupTable.name, name)),
      )
      .limit(1);

    return group || null;
  },

  async getGroupById(groupId) {
    const [group] = await db
      .select()
      .from(AgentGroupTable)
      .where(eq(AgentGroupTable.id, groupId))
      .limit(1);

    return group || null;
  },

  async addMember(groupId, agentId) {
    await db
      .insert(AgentGroupMemberTable)
      .values({
        id: generateUUID(),
        groupId,
        agentId,
      })
      .onConflictDoNothing();
  },

  async removeMember(groupId, agentId) {
    await db
      .delete(AgentGroupMemberTable)
      .where(
        and(
          eq(AgentGroupMemberTable.groupId, groupId),
          eq(AgentGroupMemberTable.agentId, agentId),
        ),
      );
  },

  async getGroupAgents(groupId) {
    const agents = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        visibility: AgentTable.visibility,
        userId: AgentTable.userId,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        lastUsedAt: AgentGroupMemberTable.lastUsedAt,
      })
      .from(AgentGroupMemberTable)
      .innerJoin(AgentTable, eq(AgentGroupMemberTable.agentId, AgentTable.id))
      .where(eq(AgentGroupMemberTable.groupId, groupId))
      .orderBy(desc(AgentGroupMemberTable.lastUsedAt));

    return agents;
  },

  async isAgentInGroup(groupId, agentId) {
    const [member] = await db
      .select()
      .from(AgentGroupMemberTable)
      .where(
        and(
          eq(AgentGroupMemberTable.groupId, groupId),
          eq(AgentGroupMemberTable.agentId, agentId),
        ),
      )
      .limit(1);

    return !!member;
  },

  async updateLastUsed(groupId, agentId) {
    await db
      .update(AgentGroupMemberTable)
      .set({ lastUsedAt: new Date() })
      .where(
        and(
          eq(AgentGroupMemberTable.groupId, groupId),
          eq(AgentGroupMemberTable.agentId, agentId),
        ),
      );
  },

  async updateTimestamp(groupId) {
    await db
      .update(AgentGroupTable)
      .set({ updatedAt: new Date() })
      .where(eq(AgentGroupTable.id, groupId));
  },

  async initializeSystemGroups(userId) {
    // 检查是否已存在
    const existingGroups = await this.getUserGroups(userId);
    const groupNames = existingGroups.map((g) => g.name);

    // 创建我的AI员工组（向后兼容）
    if (!groupNames.includes("我的AI员工")) {
      await this.createGroup(userId, {
        name: "我的AI员工",
        type: "system",
      });
    }
  },
};
