import apiClient, { type ApiResponse } from "./simpleApi";
export interface UPLOAD_FILE_RESPONSE extends ApiResponse<{
  url: string;
  publicId: string;
}> {}
export const uploadFile = async (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  let resp = await apiClient.post<UPLOAD_FILE_RESPONSE>(
    "multimedia/upload",
    fd,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return resp.data?.data.url || "";
};
