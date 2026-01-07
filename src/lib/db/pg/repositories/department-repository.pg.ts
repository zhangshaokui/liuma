import { pgDb as db } from "../db.pg";
import { DepartmentTable } from "../schema.pg";
import { eq, and, desc } from "drizzle-orm";
import { generateUUID } from "lib/utils";

export interface Department {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentRepository {
  insertDepartment(department: {
    name: string;
    userId: string;
  }): Promise<Department>;
  selectDepartmentsByUserId(userId: string): Promise<Department[]>;
  selectDepartmentById(id: string, userId: string): Promise<Department | null>;
  updateDepartment(
    id: string,
    userId: string,
    data: { name?: string },
  ): Promise<Department>;
  deleteDepartment(id: string, userId: string): Promise<void>;
}

export const pgDepartmentRepository: DepartmentRepository = {
  async insertDepartment(department) {
    const [result] = await db
      .insert(DepartmentTable)
      .values({
        id: generateUUID(),
        name: department.name,
        userId: department.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result as Department;
  },

  async selectDepartmentsByUserId(userId) {
    const result = await db
      .select()
      .from(DepartmentTable)
      .where(eq(DepartmentTable.userId, userId))
      .orderBy(desc(DepartmentTable.createdAt));
    return result as Department[];
  },

  async selectDepartmentById(id, userId) {
    const [result] = await db
      .select()
      .from(DepartmentTable)
      .where(and(eq(DepartmentTable.id, id), eq(DepartmentTable.userId, userId)));
    return (result as Department) || null;
  },

  async updateDepartment(id, userId, data) {
    const [result] = await db
      .update(DepartmentTable)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(and(eq(DepartmentTable.id, id), eq(DepartmentTable.userId, userId)))
      .returning();
    if (!result) {
      throw new Error("Department not found");
    }
    return result as Department;
  },

  async deleteDepartment(id, userId) {
    await db
      .delete(DepartmentTable)
      .where(and(eq(DepartmentTable.id, id), eq(DepartmentTable.userId, userId)));
  },
};


