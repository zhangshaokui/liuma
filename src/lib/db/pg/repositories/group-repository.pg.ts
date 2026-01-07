import { pgDb as db } from "../db.pg";
import { GroupTable, GroupAgentTable, AgentTable } from "../schema.pg";
import { eq, and, desc, inArray } from "drizzle-orm";
import { generateUUID } from "lib/utils";
import type { Agent } from "app-types/agent";
import { SUPER_EMPLOYEE_MODULES } from "@/lib/super-employee-modules";

export interface Group {
  id: string;
  name: string;
  departmentId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupWithAgents extends Group {
  agents: Agent[];
}

export interface GroupRepository {
  insertGroup(group: {
    name: string;
    departmentId: string;
    userId: string;
  }): Promise<Group>;
  selectGroupsByDepartmentId(
    departmentId: string,
    userId: string,
  ): Promise<Group[]>;
  selectGroupsByUserId(userId: string): Promise<Group[]>;
  selectGroupById(id: string, userId: string): Promise<Group | null>;
  selectGroupWithAgents(id: string, userId: string): Promise<GroupWithAgents | null>;
  updateGroup(
    id: string,
    userId: string,
    data: { name?: string },
  ): Promise<Group>;
  deleteGroup(id: string, userId: string): Promise<void>;
  addAgentToGroup(
    groupId: string,
    agentId: string,
    userId: string,
  ): Promise<void>;
  removeAgentFromGroup(
    groupId: string,
    agentId: string,
    userId: string,
  ): Promise<void>;
  getAgentsByGroupId(groupId: string, userId: string): Promise<Agent[]>;
  updateGroupAgents(
    groupId: string,
    agentIds: string[],
    userId: string,
  ): Promise<void>;
}

export const pgGroupRepository: GroupRepository = {
  async insertGroup(group) {
    const [result] = await db
      .insert(GroupTable)
      .values({
        id: generateUUID(),
        name: group.name,
        departmentId: group.departmentId,
        userId: group.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result as Group;
  },

  async selectGroupsByDepartmentId(departmentId, userId) {
    const result = await db
      .select()
      .from(GroupTable)
      .where(
        and(
          eq(GroupTable.departmentId, departmentId),
          eq(GroupTable.userId, userId),
        ),
      )
      .orderBy(desc(GroupTable.createdAt));
    return result as Group[];
  },

  async selectGroupsByUserId(userId) {
    const result = await db
      .select()
      .from(GroupTable)
      .where(eq(GroupTable.userId, userId))
      .orderBy(desc(GroupTable.createdAt));
    return result as Group[];
  },

  async selectGroupById(id, userId) {
    const [result] = await db
      .select()
      .from(GroupTable)
      .where(and(eq(GroupTable.id, id), eq(GroupTable.userId, userId)));
    return (result as Group) || null;
  },

  async selectGroupWithAgents(id, userId) {
    const [group] = await db
      .select()
      .from(GroupTable)
      .where(and(eq(GroupTable.id, id), eq(GroupTable.userId, userId)));

    if (!group) {
      return null;
    }

    // 获取所有关联的agentId（包括默认AI员工和自定义智能体）
    const groupAgentRows = await db
      .select({
        agentId: GroupAgentTable.agentId,
      })
      .from(GroupAgentTable)
      .where(
        and(
          eq(GroupAgentTable.groupId, id),
          eq(GroupAgentTable.userId, userId),
        ),
      );

    const agentIds = groupAgentRows.map((row) => row.agentId);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 分离默认AI员工ID和自定义智能体ID
    const defaultEmployeeIds = agentIds.filter((id) => !uuidRegex.test(id));
    const customAgentIds = agentIds.filter((id) => uuidRegex.test(id));

    // 获取自定义智能体
    const customAgents: Agent[] = [];
    if (customAgentIds.length > 0) {
      // 使用inArray查询所有自定义智能体
      const allCustomAgents = await db
        .select()
        .from(AgentTable)
        .where(inArray(AgentTable.id, customAgentIds as any[]));

      customAgents.push(
        ...allCustomAgents.map((agent) => ({
          ...agent,
          description: agent.description ?? undefined,
          icon: agent.icon ?? undefined,
          instructions: agent.instructions ?? {},
        })) as Agent[],
      );
    }

    // 获取默认AI员工
    const defaultEmployees: Agent[] = defaultEmployeeIds
      .map((employeeId) => {
        const module = SUPER_EMPLOYEE_MODULES[employeeId as keyof typeof SUPER_EMPLOYEE_MODULES];
        if (!module) return null;
        return {
          id: employeeId,
          name: module.name,
          description: module.role,
          icon: null,
          instructions: {
            role: module.role,
            systemPrompt: module.systemPrompt,
          },
          userId: "super-employee",
          visibility: "public" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Agent;
      })
      .filter((agent): agent is Agent => agent !== null);

    return {
      ...(group as Group),
      agents: [...defaultEmployees, ...customAgents],
    };
  },

  async updateGroup(id, userId, data) {
    const [result] = await db
      .update(GroupTable)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(and(eq(GroupTable.id, id), eq(GroupTable.userId, userId)))
      .returning();
    if (!result) {
      throw new Error("Group not found");
    }
    return result as Group;
  },

  async deleteGroup(id, userId) {
    await db
      .delete(GroupTable)
      .where(and(eq(GroupTable.id, id), eq(GroupTable.userId, userId)));
  },

  async addAgentToGroup(groupId, agentId, userId) {
    await db.insert(GroupAgentTable).values({
      id: generateUUID(),
      groupId,
      agentId,
      userId,
      createdAt: new Date(),
    });
  },

  async removeAgentFromGroup(groupId, agentId, userId) {
    await db
      .delete(GroupAgentTable)
      .where(
        and(
          eq(GroupAgentTable.groupId, groupId),
          eq(GroupAgentTable.agentId, agentId),
          eq(GroupAgentTable.userId, userId),
        ),
      );
  },

  async getAgentsByGroupId(groupId, userId) {
    // 获取所有关联的agentId（包括默认AI员工和自定义智能体）
    const groupAgentRows = await db
      .select({
        agentId: GroupAgentTable.agentId,
      })
      .from(GroupAgentTable)
      .where(
        and(
          eq(GroupAgentTable.groupId, groupId),
          eq(GroupAgentTable.userId, userId),
        ),
      );

    const agentIds = groupAgentRows.map((row) => row.agentId);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 分离默认AI员工ID和自定义智能体ID
    const defaultEmployeeIds = agentIds.filter((id) => !uuidRegex.test(id));
    const customAgentIds = agentIds.filter((id) => uuidRegex.test(id));

    // 获取自定义智能体
    const customAgents: Agent[] = [];
    if (customAgentIds.length > 0) {
      const allCustomAgents = await db
        .select()
        .from(AgentTable)
        .where(inArray(AgentTable.id, customAgentIds as any[]));

      customAgents.push(
        ...allCustomAgents.map((agent) => ({
          ...agent,
          description: agent.description ?? undefined,
          icon: agent.icon ?? undefined,
          instructions: agent.instructions ?? {},
        })) as Agent[],
      );
    }

    // 获取默认AI员工
    const defaultEmployees: Agent[] = defaultEmployeeIds
      .map((employeeId) => {
        const module = SUPER_EMPLOYEE_MODULES[employeeId as keyof typeof SUPER_EMPLOYEE_MODULES];
        if (!module) return null;
        return {
          id: employeeId,
          name: module.name,
          description: module.role,
          icon: null,
          instructions: {
            role: module.role,
            systemPrompt: module.systemPrompt,
          },
          userId: "super-employee",
          visibility: "public" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Agent;
      })
      .filter((agent): agent is Agent => agent !== null);

    return [...defaultEmployees, ...customAgents];
  },

  async updateGroupAgents(groupId, agentIds, userId) {
    // 先删除所有现有的关联
    await db
      .delete(GroupAgentTable)
      .where(
        and(
          eq(GroupAgentTable.groupId, groupId),
          eq(GroupAgentTable.userId, userId),
        ),
      );

    // 然后添加新的关联
    if (agentIds.length > 0) {
      await db.insert(GroupAgentTable).values(
        agentIds.map((agentId) => ({
          id: generateUUID(),
          groupId,
          agentId,
          userId,
          createdAt: new Date(),
        })),
      );
    }
  },
};

