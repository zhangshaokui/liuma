import { create } from "zustand";

// Agent Management State
export interface AgentManagementState {
  // UI状态
  expandedDepartments: string[];
  selectedDepartment: string | null;
  selectedGroup: string | null;

  // 对话框状态
  isCreateDepartmentDialogOpen: boolean;
  isEditDepartmentDialogOpen: boolean;
  isCreateGroupDialogOpen: boolean;
  isEditGroupDialogOpen: boolean;
  isMoveAgentDialogOpen: boolean;

  // 当前编辑的部门/小组
  editingDepartment: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  editingGroup: {
    id: string;
    name: string;
    color: string;
    icon: string;
    departmentId: string | null;
  } | null;
  creatingGroupDepartmentId: string | null;

  // 移动AI员工
  movingAgentId: string | null;
  movingAgentName: string | null;

  // 右键菜单状态
  contextMenuTarget: {
    type: "department" | "group" | "agent" | null;
    id: string | null;
    position: { x: number; y: number } | null;
  };

  // 搜索状态
  searchQuery: string; // 部门/小组搜索
  agentSearchQuery: string; // AI员工搜索
}

// Agent Management Actions
export interface AgentManagementDispatch {
  // 展开/折叠部门
  toggleDepartment: (id: string) => void;
  expandDepartment: (id: string) => void;
  collapseDepartment: (id: string) => void;
  expandAllDepartments: (ids: string[]) => void;
  collapseAllDepartments: () => void;

  // 选择部门/小组
  selectDepartment: (id: string | null) => void;
  selectGroup: (id: string | null) => void;

  // 对话框控制
  openCreateDepartmentDialog: () => void;
  closeCreateDepartmentDialog: () => void;

  openEditDepartmentDialog: (department: {
    id: string;
    name: string;
    color: string;
    icon: string;
  }) => void;
  closeEditDepartmentDialog: () => void;

  openCreateGroupDialog: (departmentId?: string) => void;
  closeCreateGroupDialog: () => void;
  getCreatingGroupDepartmentId: () => string | null;

  openEditGroupDialog: (group: {
    id: string;
    name: string;
    color: string;
    icon: string;
    departmentId: string | null;
  }) => void;
  closeEditGroupDialog: () => void;

  openMoveAgentDialog: (agentId: string, agentName: string) => void;
  closeMoveAgentDialog: () => void;

  // 右键菜单控制
  openContextMenu: (
    type: "department" | "group" | "agent",
    id: string,
    position: { x: number; y: number },
  ) => void;
  closeContextMenu: () => void;

  // 搜索
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  setAgentSearchQuery: (query: string) => void;
  clearAgentSearchQuery: () => void;

  // 重置状态
  reset: () => void;
}

// Initial state
const initialState: AgentManagementState = {
  expandedDepartments: [],
  selectedDepartment: null,
  selectedGroup: null,
  isCreateDepartmentDialogOpen: false,
  isEditDepartmentDialogOpen: false,
  isCreateGroupDialogOpen: false,
  isEditGroupDialogOpen: false,
  isMoveAgentDialogOpen: false,
  editingDepartment: null,
  editingGroup: null,
  creatingGroupDepartmentId: null,
  movingAgentId: null,
  movingAgentName: null,
  contextMenuTarget: {
    type: null,
    id: null,
    position: null,
  },
  searchQuery: "",
  agentSearchQuery: "",
};

// Create store
export const useAgentManagementStore = create<
  AgentManagementState & AgentManagementDispatch
>((set) => ({
  ...initialState,

  // 展开/折叠部门
  toggleDepartment: (id) =>
    set((state) => ({
      expandedDepartments: state.expandedDepartments.includes(id)
        ? state.expandedDepartments.filter((d) => d !== id)
        : [...state.expandedDepartments, id],
    })),

  expandDepartment: (id) =>
    set((state) => ({
      expandedDepartments: state.expandedDepartments.includes(id)
        ? state.expandedDepartments
        : [...state.expandedDepartments, id],
    })),

  collapseDepartment: (id) =>
    set((state) => ({
      expandedDepartments: state.expandedDepartments.filter((d) => d !== id),
    })),

  expandAllDepartments: (ids) => set({ expandedDepartments: ids }),

  collapseAllDepartments: () => set({ expandedDepartments: [] }),

  // 选择部门/小组
  selectDepartment: (id) =>
    set({ selectedDepartment: id, selectedGroup: null }),

  selectGroup: (id) => set({ selectedGroup: id }),

  // 对话框控制
  openCreateDepartmentDialog: () => set({ isCreateDepartmentDialogOpen: true }),

  closeCreateDepartmentDialog: () =>
    set({ isCreateDepartmentDialogOpen: false }),

  openEditDepartmentDialog: (department) =>
    set({
      editingDepartment: department,
      isEditDepartmentDialogOpen: true,
    }),

  closeEditDepartmentDialog: () =>
    set({
      isEditDepartmentDialogOpen: false,
      editingDepartment: null,
    }),

  openCreateGroupDialog: (departmentId) =>
    set({
      isCreateGroupDialogOpen: true,
      creatingGroupDepartmentId: departmentId || null,
    }),

  closeCreateGroupDialog: () =>
    set({
      isCreateGroupDialogOpen: false,
      creatingGroupDepartmentId: null,
    }),

  getCreatingGroupDepartmentId: () => {
    const state = useAgentManagementStore.getState();
    return state.creatingGroupDepartmentId;
  },

  openEditGroupDialog: (group) =>
    set({
      editingGroup: group,
      isEditGroupDialogOpen: true,
    }),

  closeEditGroupDialog: () =>
    set({
      isEditGroupDialogOpen: false,
      editingGroup: null,
    }),

  openMoveAgentDialog: (agentId, agentName) =>
    set({
      movingAgentId: agentId,
      movingAgentName: agentName,
      isMoveAgentDialogOpen: true,
    }),

  closeMoveAgentDialog: () =>
    set({
      isMoveAgentDialogOpen: false,
      movingAgentId: null,
      movingAgentName: null,
    }),

  // 右键菜单控制
  openContextMenu: (type, id, position) =>
    set({
      contextMenuTarget: { type, id, position },
    }),

  closeContextMenu: () =>
    set({
      contextMenuTarget: {
        type: null,
        id: null,
        position: null,
      },
    }),

  // 搜索
  setSearchQuery: (query) => set({ searchQuery: query }),

  clearSearchQuery: () => set({ searchQuery: "" }),

  setAgentSearchQuery: (query) => set({ agentSearchQuery: query }),

  clearAgentSearchQuery: () => set({ agentSearchQuery: "" }),

  // 重置状态
  reset: () => set(initialState),
}));
