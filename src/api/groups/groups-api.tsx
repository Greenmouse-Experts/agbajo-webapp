import apiClient, { type ApiResponse } from "../simpleApi";

export interface Contribution {
  id: string;
  amount: number;
  status: "pending" | "paid" | "insufficient_funds";
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ContributionsParams {
  groupId?: string;
  status?: "pending" | "paid" | "insufficient_funds";
  limit?: number;
  cursor?: string;
}

export const getContributionsApi = async (
  params: ContributionsParams,
): Promise<ApiResponse<{ contributions: Contribution[]; total?: number }>> => {
  const resp = await apiClient.get("/contributions", { params });
  return resp.data;
};

export const createSlotApi = async (params: {
  groupId: string;
  memberId: string[];
}): Promise<ApiResponse<{}>> => {
  const resp = await apiClient.post(`/groups/${params.groupId}/cycles`, {
    slotOrder: params.memberId,
  });
  return resp.data;
};

export interface GroupSlotUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface GroupSlot {
  id: string;
  cycleId: string;
  userId: string;
  user?: GroupSlotUser;
  slotOrder: number;
  status: "current" | "pending" | "paid" | "completed" | string;
  payoutDate: string | null;
  payoutAmount: string | number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  deductions?: any[];
}

export interface GroupCycle {
  id: string;
  groupId: string;
  cycleNumber: number;
  status: "pending" | "active" | "completed" | string;
  startDate: string | null;
  endDate: string | null;
  totalPoolAmount: string | number;
  createdAt: string;
  updatedAt: string;
  slots: GroupSlot[];
}

export const getSlotsApi = async (params: {
  groupId: string;
}): Promise<ApiResponse<GroupCycle>> => {
  const resp = await apiClient.get(`/groups/${params.groupId}/cycles/current`);
  return resp.data;
};

export const getGroupSlotsApi = async (params: {
  groupId: string;
}): Promise<ApiResponse<GroupCycle[]>> => {
  const resp = await apiClient.get(`/groups/${params.groupId}/cycles`);
  return resp.data;
};
export const getAdminGroupSlotsApi = async (params: {
  groupId: string;
}): Promise<ApiResponse<GroupCycle[]>> => {
  const resp = await apiClient.get(`admins/groups/${params.groupId}/cycles`);
  return resp.data;
};

export const publishCycleApi = async (params: {
  groupId: string;
  cycleId: string;
}): Promise<ApiResponse<GroupCycle>> => {
  const resp = await apiClient.post(
    `/groups/${params.groupId}/cycles/${params.cycleId}/publish`,
  );
  return resp.data;
};
export const adminPublishCycleApi = async (params: {
  groupId: string;
  cycleId: string;
}): Promise<ApiResponse<GroupCycle>> => {
  const resp = await apiClient.post(
    `admins/groups/${params.groupId}/cycles/${params.cycleId}/publish`,
  );
  return resp.data;
};

export const getCycleDetailsApi = async (params: {
  groupId: string;
  cycleId: string;
}): Promise<ApiResponse<GroupCycle>> => {
  const resp = await apiClient.get(
    `/groups/${params.groupId}/cycles/${params.cycleId}`,
  );
  return resp.data;
};

export const reorderSlotsApi = async (params: {
  groupId: string;
  cycleId: string;
  slotOrder: string[];
}): Promise<ApiResponse<{}>> => {
  const resp = await apiClient.put(
    `/groups/${params.groupId}/cycles/${params.cycleId}/reorder-slots`,
    { slotOrder: params.slotOrder },
  );
  return resp.data;
};
