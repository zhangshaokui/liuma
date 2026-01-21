import { Agent, AgentRepository, AgentSummary } from "app-types/agent";
import { pgAgentGroupRepository } from "./agent-group-repository.pg";
import { pgDb as db } from "../db.pg";
import {
  AgentTable,
  BookmarkTable,
  UserTable,
  UserEmployeeTable,
} from "../schema.pg";
import { AgentGroupMemberTable } from "../schema.pg";
import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { generateUUID } from "lib/utils";

export const pgAgentRepository: AgentRepository = {
  async insertAgent(agent) {
    const [result] = await db
      .insert(AgentTable)
      .values({
        id: generateUUID(),
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        userId: agent.userId,
        instructions: agent.instructions,
        visibility: agent.visibility || "private",
        // Agent Store template fields
        isTemplate: agent.isTemplate ?? false,
        categoryId: agent.categoryId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
    };
  },

  async selectAgentById(id, userId): Promise<Agent | null> {
    const [result] = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        instructions: AgentTable.instructions,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        isBookmarked: sql<boolean>`${BookmarkTable.id} IS NOT NULL`,
        isTemplate: AgentTable.isTemplate,
        categoryId: AgentTable.categoryId,
        copyCount: AgentTable.copyCount,
        coverEmoji: AgentTable.coverEmoji,
      })
      .from(AgentTable)
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemType, "agent"),
        ),
      )
      .where(
        and(
          eq(AgentTable.id, id),
          or(
            eq(AgentTable.userId, userId), // Own agent
            eq(AgentTable.visibility, "public"), // Public agent
            eq(AgentTable.visibility, "readonly"), // Readonly agent
          ),
        ),
      );

    if (!result) return null;

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      isBookmarked: result.isBookmarked ?? false,
    };
  },

  async selectAgentsByUserId(userId) {
    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        instructions: AgentTable.instructions,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        isBookmarked: sql<boolean>`false`,
      })
      .from(AgentTable)
      .innerJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .where(eq(AgentTable.userId, userId))
      .orderBy(desc(AgentTable.createdAt));

    // Map database nulls to undefined and set defaults for owned agents
    return results.map((result) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
      isBookmarked: false, // Always false for owned agents
    }));
  },

  async updateAgent(id, userId, agent) {
    const [result] = await db
      .update(AgentTable)
      .set({
        ...agent,
        updatedAt: new Date(),
      })
      .where(
        and(
          // Only allow updates to agents owned by the user or public agents
          eq(AgentTable.id, id),
          or(
            eq(AgentTable.userId, userId),
            eq(AgentTable.visibility, "public"),
          ),
        ),
      )
      .returning();

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
    };
  },

  async deleteAgent(id, userId) {
    await db
      .delete(AgentTable)
      .where(and(eq(AgentTable.id, id), eq(AgentTable.userId, userId)));
  },

  async selectAgents(
    currentUserId,
    filters = ["all"],
    limit = 50,
  ): Promise<AgentSummary[]> {
    let orConditions: any[] = [];

    // Build OR conditions based on filters array
    for (const filter of filters) {
      if (filter === "mine") {
        orConditions.push(eq(AgentTable.userId, currentUserId));
      } else if (filter === "shared") {
        orConditions.push(
          and(
            ne(AgentTable.userId, currentUserId),
            or(
              eq(AgentTable.visibility, "public"),
              eq(AgentTable.visibility, "readonly"),
            ),
          ),
        );
      } else if (filter === "bookmarked") {
        orConditions.push(
          and(
            ne(AgentTable.userId, currentUserId),
            or(
              eq(AgentTable.visibility, "public"),
              eq(AgentTable.visibility, "readonly"),
            ),
            sql`${BookmarkTable.id} IS NOT NULL`,
          ),
        );
      } else if (filter === "all") {
        // All available agents (mine + shared) - this overrides other filters
        orConditions = [
          or(
            // My agents
            eq(AgentTable.userId, currentUserId),
            // Shared agents
            and(
              ne(AgentTable.userId, currentUserId),
              or(
                eq(AgentTable.visibility, "public"),
                eq(AgentTable.visibility, "readonly"),
              ),
            ),
          ),
        ];
        break; // "all" overrides everything else
      }
    }

    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        // Exclude instructions from list queries for performance
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        isBookmarked: sql<boolean>`CASE WHEN ${BookmarkTable.id} IS NOT NULL THEN true ELSE false END`,
        isEmployee: sql<boolean>`CASE WHEN ${UserEmployeeTable.id} IS NOT NULL THEN true ELSE false END`,
        isTemplate: AgentTable.isTemplate,
        categoryId: AgentTable.categoryId,
        copyCount: AgentTable.copyCount,
        coverEmoji: AgentTable.coverEmoji,
      })
      .from(AgentTable)
      .innerJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.itemType, "agent"),
          eq(BookmarkTable.userId, currentUserId),
        ),
      )
      .leftJoin(
        UserEmployeeTable,
        and(
          eq(UserEmployeeTable.agentId, AgentTable.id),
          eq(UserEmployeeTable.userId, currentUserId),
        ),
      )
      .where(orConditions.length > 1 ? or(...orConditions) : orConditions[0])
      .orderBy(
        // My agents first, then other shared agents
        sql`CASE WHEN ${AgentTable.userId} = ${currentUserId} THEN 0 ELSE 1 END`,
        desc(AgentTable.createdAt),
      )
      .limit(limit);

    // Map database nulls to undefined
    return results.map((result) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
    }));
  },

  async checkAccess(agentId, userId, destructive = false) {
    const [agent] = await db
      .select({
        visibility: AgentTable.visibility,
        userId: AgentTable.userId,
      })
      .from(AgentTable)
      .where(eq(AgentTable.id, agentId));
    if (!agent) {
      return false;
    }
    if (userId == agent.userId) return true;
    if (agent.visibility === "public" && !destructive) return true;
    return false;
  },

  async selectAgentsByGroup(
    currentUserId: string,
    groupName: string,
  ): Promise<AgentSummary[]> {
    const group = await pgAgentGroupRepository.getGroupByName(
      currentUserId,
      groupName,
    );
    if (!group) {
      return [];
    }

    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        lastUsedAt: AgentGroupMemberTable.lastUsedAt,
        isBookmarked: sql<boolean>`CASE WHEN ${BookmarkTable.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(AgentGroupMemberTable)
      .innerJoin(AgentTable, eq(AgentGroupMemberTable.agentId, AgentTable.id))
      .innerJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.itemType, "agent"),
          eq(BookmarkTable.userId, currentUserId),
        ),
      )
      .where(eq(AgentGroupMemberTable.groupId, group.id))
      .orderBy(desc(AgentGroupMemberTable.lastUsedAt));

    // Map database nulls to undefined
    return results.map((result: any) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
    }));
  },

  async getAgentById(agentId: string) {
    const [agent] = await db
      .select()
      .from(AgentTable)
      .where(eq(AgentTable.id, agentId))
      .limit(1);

    if (!agent) return null;

    return {
      ...agent,
      description: agent.description ?? undefined,
      icon: agent.icon ?? undefined,
      instructions: agent.instructions ?? {},
    };
  },

  async incrementCopyCount(agentId: string) {
    await db
      .update(AgentTable)
      .set({ copyCount: sql`copy_count + 1` })
      .where(eq(AgentTable.id, agentId));
  },

  async selectAgentsByGroupId(
    currentUserId: string,
    groupId: string,
  ): Promise<AgentSummary[]> {
    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        isBookmarked: sql<boolean>`CASE WHEN ${BookmarkTable.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(AgentTable)
      .innerJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.itemType, "agent"),
          eq(BookmarkTable.userId, currentUserId),
        ),
      )
      .where(eq(AgentTable.groupId, groupId))
      .orderBy(desc(AgentTable.updatedAt));

    // Map database nulls to undefined
    return results.map((result: any) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
    }));
  },

  async selectAgentsByDepartmentId(
    currentUserId: string,
    departmentId: string,
  ): Promise<AgentSummary[]> {
    // Get all groups in the department
    const { AgentGroupTable, DepartmentTable } = await import("../schema.pg");

    // 检查是否是"默认部门"
    const [department] = await db
      .select()
      .from(DepartmentTable)
      .where(eq(DepartmentTable.id, departmentId))
      .limit(1);

    const isDefaultDepartment = department?.name === "默认部门";

    const groups = await db
      .select({ id: AgentGroupTable.id })
      .from(AgentGroupTable)
      .where(eq(AgentGroupTable.departmentId, departmentId));

    const groupIds = groups.map((g) => g.id);

    // 构建查询条件
    let whereCondition;

    if (isDefaultDepartment) {
      // 默认部门：显示所有 groupId 为 null 或在该部门小组中的员工
      if (groupIds.length > 0) {
        whereCondition = and(
          eq(AgentTable.userId, currentUserId), // 只查询当前用户的员工
          or(
            isNull(AgentTable.groupId),
            ...groupIds.map((groupId) => eq(AgentTable.groupId, groupId)),
          ),
        );
      } else {
        // 如果没有小组，只显示 groupId 为 null 的员工
        whereCondition = and(
          eq(AgentTable.userId, currentUserId), // 只查询当前用户的员工
          isNull(AgentTable.groupId),
        );
      }
    } else {
      // 普通部门：只显示在该部门小组中的员工
      if (groupIds.length === 0) {
        return [];
      }
      whereCondition = and(
        eq(AgentTable.userId, currentUserId), // 只查询当前用户的员工
        or(...groupIds.map((groupId) => eq(AgentTable.groupId, groupId))),
      );
    }

    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        isBookmarked: sql<boolean>`CASE WHEN ${BookmarkTable.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(AgentTable)
      .innerJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.itemType, "agent"),
          eq(BookmarkTable.userId, currentUserId),
        ),
      )
      .where(whereCondition)
      .orderBy(desc(AgentTable.updatedAt));

    // Map database nulls to undefined
    return results.map((result: any) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
    }));
  },
};
