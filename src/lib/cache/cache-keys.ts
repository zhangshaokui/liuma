export const CacheKeys = {
  thread: (threadId: string) => `thread-${threadId}`,
  user: (userId: string) => `user-${userId}`,
  mcpServerCustomizations: (userId: string) =>
    `mcp-server-customizations-${userId}`,
  agentInstructions: (agent: string) => `agent-instructions-${agent}`,
  userDepartments: (userId: string) => `user-departments-${userId}`,
  userGroups: (userId: string) => `user-groups-${userId}`,
};
