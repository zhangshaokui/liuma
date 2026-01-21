import { and, asc, desc, eq, ne, or, sql } from "drizzle-orm";
import { generateUUID } from "lib/utils";
import { pgDb as db } from "../db.pg";
import { AgentGroupTable, AgentTable, DepartmentTable } from "../schema.pg";

export interface Department {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentWithGroups extends Department {
  groups: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    sortOrder: number;
    agentCount: number;
    type?: string;
    departmentId: string | null;
  }>;
  agentCount: number;
}

export interface DepartmentRepository {
  create(
    userId: string,
    data: { name: string; color?: string; icon?: string; sortOrder?: number },
  ): Promise<Department>;

  update(
    departmentId: string,
    userId: string,
    data: { name?: string; color?: string; icon?: string; sortOrder?: number },
  ): Promise<Department>;

  delete(departmentId: string, userId: string): Promise<void>;

  findById(departmentId: string): Promise<Department | null>;

  findByUserId(userId: string): Promise<Department[]>;

  findWithGroups(userId: string): Promise<DepartmentWithGroups[]>;

  findByName(userId: string, name: string): Promise<Department | null>;

  updateTimestamp(departmentId: string): Promise<void>;

  initializeDefaultDepartment(userId: string): Promise<Department>;

  migrateOldDepartmentNames(userId: string): Promise<void>;
}

export const pgDepartmentRepository: DepartmentRepository = {
  async create(userId, data) {
    const [result] = await db
      .insert(DepartmentTable)
      .values({
        id: generateUUID(),
        userId,
        name: data.name,
        color: data.color || "#3b82f6",
        icon: data.icon || "🏢",
        sortOrder: data.sortOrder || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result;
  },

  async update(departmentId, userId, data) {
    const [result] = await db
      .update(DepartmentTable)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(DepartmentTable.id, departmentId),
          eq(DepartmentTable.userId, userId),
        ),
      )
      .returning();

    return result;
  },

  async delete(departmentId, userId) {
    await db.delete(DepartmentTable).where(
      and(
        eq(DepartmentTable.id, departmentId),
        eq(DepartmentTable.userId, userId),
        // 不允许删除默认的"默认部门"
        ne(DepartmentTable.name, "默认部门"),
      ),
    );
  },

  async findById(departmentId) {
    const [department] = await db
      .select()
      .from(DepartmentTable)
      .where(eq(DepartmentTable.id, departmentId))
      .limit(1);

    return department || null;
  },

  async findByUserId(userId) {
    const departments = await db
      .select()
      .from(DepartmentTable)
      .where(eq(DepartmentTable.userId, userId))
      .orderBy(asc(DepartmentTable.sortOrder), desc(DepartmentTable.createdAt));

    return departments;
  },

  async findWithGroups(userId) {
    const departments = await this.findByUserId(userId);

    const result: DepartmentWithGroups[] = [];

    // 获取用户所有AI员工总数
    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(AgentTable)
      .where(eq(AgentTable.userId, userId));
    const totalAgentCount = Number(totalCountResult?.count || 0);

    // 用于累计非默认部门的AI员工数
    let otherDepartmentAgentCount = 0;

    for (const department of departments) {
      // 获取该部门下的小组
      const groups = await db
        .select({
          id: AgentGroupTable.id,
          name: AgentGroupTable.name,
          color: AgentGroupTable.color,
          icon: AgentGroupTable.icon,
          sortOrder: AgentGroupTable.sortOrder,
          type: AgentGroupTable.type,
          departmentId: AgentGroupTable.departmentId,
        })
        .from(AgentGroupTable)
        .where(eq(AgentGroupTable.departmentId, department.id))
        .orderBy(asc(AgentGroupTable.sortOrder));

      // 为每个小组计算AI员工数量
      const groupsWithCounts = await Promise.all(
        groups.map(async (group) => {
          const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(AgentTable)
            .where(eq(AgentTable.groupId, group.id));

          return {
            ...group,
            agentCount: Number(countResult?.count || 0),
          };
        }),
      );

      // 计算部门的AI员工总数（包括所有小组）
      // 先获取该部门下所有小组的ID
      const groupIds = groups.map((g) => g.id);

      let agentCount = 0;
      if (groupIds.length > 0) {
        // 统计这些小组中的AI员工数量
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(AgentTable)
          .where(
            and(
              eq(AgentTable.userId, userId),
              // 使用or条件匹配任意一个小组
              or(...groupIds.map((groupId) => eq(AgentTable.groupId, groupId))),
            ),
          );
        agentCount = Number(countResult?.count || 0);
      }

      // 如果不是默认部门，累计到其他部门计数
      if (department.name !== "默认部门") {
        otherDepartmentAgentCount += agentCount;
      }

      result.push({
        ...department,
        groups: groupsWithCounts,
        agentCount,
      });
    }

    // 为默认部门设置正确的数量（总数 - 其他部门的数量）
    const defaultDept = result.find((d) => d.name === "默认部门");
    if (defaultDept) {
      defaultDept.agentCount = totalAgentCount - otherDepartmentAgentCount;
    }

    return result;
  },

  async findByName(userId, name) {
    const [department] = await db
      .select()
      .from(DepartmentTable)
      .where(
        and(eq(DepartmentTable.userId, userId), eq(DepartmentTable.name, name)),
      )
      .limit(1);

    return department || null;
  },

  async updateTimestamp(departmentId) {
    await db
      .update(DepartmentTable)
      .set({ updatedAt: new Date() })
      .where(eq(DepartmentTable.id, departmentId));
  },

  async initializeDefaultDepartment(userId) {
    // 检查是否已存在默认部门
    const existing = await this.findByName(userId, "默认部门");
    if (existing) {
      return existing;
    }

    // 检查是否存在旧的"待分配部门"，如果有则重命名
    const [oldDept] = await db
      .select()
      .from(DepartmentTable)
      .where(
        and(
          eq(DepartmentTable.userId, userId),
          eq(DepartmentTable.name, "待分配部门"),
        ),
      )
      .limit(1);

    if (oldDept) {
      // 重命名为"默认部门"
      const [updated] = await db
        .update(DepartmentTable)
        .set({ name: "默认部门", updatedAt: new Date() })
        .where(eq(DepartmentTable.id, oldDept.id))
        .returning();
      return updated;
    }

    // 创建默认部门
    return await this.create(userId, {
      name: "默认部门",
      color: "#94a3b8",
      icon: "📋",
      sortOrder: 999,
    });
  },

  // 添加一个方法来修复所有用户的旧部门名称
  async migrateOldDepartmentNames(userId: string) {
    // 重命名"待分配部门"为"默认部门"
    await db
      .update(DepartmentTable)
      .set({ name: "默认部门", updatedAt: new Date() })
      .where(
        and(
          eq(DepartmentTable.userId, userId),
          eq(DepartmentTable.name, "待分配部门"),
        ),
      );
  },
};
