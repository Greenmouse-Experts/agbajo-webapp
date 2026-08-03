import apiClient from "../simpleApi";

export const getContributionsApi = async (props: {
  groupId?: string;
  status: "pending" | "paid" | "insufficient_funds";
  limit: number;
  cursor?: string;
}) => {
  let resp = await apiClient.get("/contributions", { params: props });
  return resp.data;
};
