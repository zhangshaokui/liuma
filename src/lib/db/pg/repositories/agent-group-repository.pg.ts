import { and, eq, desc } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { AgentGroupTable, AgentGroupMemberTable, AgentTable } from "../schema.pg";
import { generateUUID } from "lib/utils";

export interface AgentGroupRepository {
  // 组管理
  createGroup(userId: string, name: string, type: "system" | "custom"): Promise<{id: string, name: string, type: string}>;
  getUserGroups(userId: string): Promise<Array<{id: string, name: string, type: string}>>;
  deleteGroup(groupId: string, userId: string): Promise<void>;
  getGroupByName(userId: string, name: string): Promise<{id: string, name: string, type: string} | null>;
  
  // 成员管理
  addMember(groupId: string, agentId: string): Promise<void>;
  removeMember(groupId: string, agentId: string): Promise<void>;
  getGroupAgents(groupId: string): Promise<Array<any>>;
  isAgentInGroup(groupId: string, agentId: string): Promise<boolean>;
  
  // 使用记录
  updateLastUsed(groupId: string, agentId: string): Promise<void>;
  
  // 系统组初始化
  initializeSystemGroups(userId: string): Promise<void>;
}

export const pgAgentGroupRepository: AgentGroupRepository = {
  async createGroup(userId, name, type) {
    const [result] = await db
      .insert(AgentGroupTable)
      .values({
        id: generateUUID(),
        userId,
        name,
        type,
      })
      .returning();
    
    return {
      id: result.id,
      name: result.name,
      type: result.type,
    };
  },

  async getUserGroups(userId) {
    const groups = await db
      .select()
      .from(AgentGroupTable)
      .where(eq(AgentGroupTable.userId, userId))
      .orderBy(desc(AgentGroupTable.createdAt));

    return groups.map(g => ({
      id: g.id,
      name: g.name,
      type: g.type,
    }));
  },

  async deleteGroup(groupId, userId) {
    await db
      .delete(AgentGroupTable)
      .where(
        and(
          eq(AgentGroupTable.id, groupId),
          eq(AgentGroupTable.userId, userId),
          eq(AgentGroupTable.type, "custom"), // 只能删除自定义组
        ),
      );
  },

  async getGroupByName(userId, name) {
    const [group] = await db
      .select()
      .from(AgentGroupTable)
      .where(
        and(
          eq(AgentGroupTable.userId, userId),
          eq(AgentGroupTable.name, name),
        ),
      )
      .limit(1);

    return group ? { id: group.id, name: group.name, type: group.type } : null;
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

  async initializeSystemGroups(userId) {
    // 检查是否已存在
    const existingGroups = await this.getUserGroups(userId);
    const groupNames = existingGroups.map(g => g.name);

    // 创建我的AI员工组
    if (!groupNames.includes("我的AI员工")) {
      await this.createGroup(userId, "我的AI员工", "system");
    }
  },
};
