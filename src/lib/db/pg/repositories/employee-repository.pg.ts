import { and, eq } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { UserEmployeeTable, AgentTable } from "../schema.pg";

export interface EmployeeRepository {
  addEmployee(userId: string, agentId: string): Promise<void>;
  
  removeEmployee(userId: string, agentId: string): Promise<void>;
  
  getEmployeeAgents(userId: string): Promise<Array<{id: string, name: string, description: string | null, icon: any, visibility: string, userId: string, createdAt: Date, updatedAt: Date}>>;
  
  isEmployee(userId: string, agentId: string): Promise<boolean>;
  
  checkAgentAccess(agentId: string, userId: string): Promise<boolean>;
}

export const pgEmployeeRepository: EmployeeRepository = {
  async addEmployee(userId, agentId) {
    await db
      .insert(UserEmployeeTable)
      .values({
        userId,
        agentId,
      })
      .onConflictDoNothing();
  },

  async removeEmployee(userId, agentId) {
    await db
      .delete(UserEmployeeTable)
      .where(
        and(
          eq(UserEmployeeTable.userId, userId),
          eq(UserEmployeeTable.agentId, agentId),
        ),
      );
  },

  async getEmployeeAgents(userId) {
    const employees = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        visibility: AgentTable.visibility,
        userId: AgentTable.userId,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
      })
      .from(UserEmployeeTable)
      .innerJoin(AgentTable, eq(UserEmployeeTable.agentId, AgentTable.id))
      .where(eq(UserEmployeeTable.userId, userId));

    return employees;
  },

  async isEmployee(userId, agentId) {
    const employee = await db
      .select()
      .from(UserEmployeeTable)
      .where(
        and(
          eq(UserEmployeeTable.userId, userId),
          eq(UserEmployeeTable.agentId, agentId),
        ),
      )
      .limit(1);

    return employee.length > 0;
  },

  async checkAgentAccess(agentId, userId) {
    const agent = await db
      .select()
      .from(AgentTable)
      .where(eq(AgentTable.id, agentId))
      .limit(1);

    if (!agent[0]) return false;

    // Can add as employee if it's public/readonly or if it's their own agent
    return (
      agent[0].visibility === "public" ||
      agent[0].visibility === "readonly" ||
      agent[0].userId === userId
    );
  },
};
