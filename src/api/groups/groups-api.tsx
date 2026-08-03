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
    memberId: params.memberId,
  });
  return resp.data;
};

export const getSlotsApi = async (params: {
  groupId: string;
}): Promise<ApiResponse<{ cycles: [] }>> => {
  const resp = await apiClient.get(`/groups/${params.groupId}/cycles/current`);
  return resp.data;
};
