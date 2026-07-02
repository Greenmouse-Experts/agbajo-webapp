import apiClient, { type ApiResponse } from "./simpleApi";

export interface UPLOAD_IMAGE_RESPONSE extends ApiResponse<{
  url: string;
  publicId: string;
}> {}

export const uploadImage = async (
  image: File | Blob,
): Promise<UPLOAD_IMAGE_RESPONSE> => {
  const formData = new FormData();
  formData.append("file", image);

  let resp = await apiClient.post("multimedia/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return resp.data;
};
