import { employeeRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import { EmployeesList } from "@/components/employee/employees-list";

// Force dynamic rendering to avoid static generation issues with session
export const dynamic = "force-dynamic";

export default async function AIEmployeePage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  // Fetch employees data on the server
  const employees = await employeeRepository.getEmployeeAgents(session.user.id);

  return (
    <EmployeesList
      initialEmployees={employees}
      userId={session.user.id}
    />
  );
}
