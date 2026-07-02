import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai/react";
import { getDefaultStore } from "jotai/vanilla";
import type { USER, USER_KYC } from "@/types";
import apiClient, { type ApiResponse } from "@/api/simpleApi";
import { toast } from "sonner";
import { extract_message } from "@/helpers/apihelpers";
import { set } from "zod";

export interface AUTHRECORD {
  user: USER;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}
const stored = localStorage.getItem("user");
const userKyc = localStorage.getItem("kyc");
export const user_atom = atomWithStorage<AUTHRECORD | null>(
  "user",
  stored ? JSON.parse(stored) : null,
);
export const kyc_atom = atomWithStorage<USER_KYC | null>(
  "kyc",
  userKyc ? JSON.parse(userKyc) : null,
);
export const useKyc = () => {
  const [kyc, setKyc] = useAtom(kyc_atom);
  return [kyc, setKyc] as const;
};
export const useAuth = () => {
  const [user, setUser] = useAtom(user_atom);
  return [user, setUser] as const;
};

export const get_user_value = () => {
  const store = getDefaultStore();
  return store.get(user_atom);
};
export const get_kyc_value = () => {
  const store = getDefaultStore();
  return store.get(kyc_atom);
};

export const clear_user = () => {
  const store = getDefaultStore();

  store.set(user_atom, null);
};
export const clear_kyc = () => {
  const store = getDefaultStore();
  store.set(kyc_atom, null);
};

export const set_user_value = (user: AUTHRECORD) => {
  const store = getDefaultStore();
  store.set(user_atom, user);
};

export const set_kyc_value = (kyc: USER_KYC) => {
  const store = getDefaultStore();
  store.set(kyc_atom, kyc);
};

let temp_user_atom = atomWithStorage<string | null>("temp_user", null);

export const set_temp_user_value = (user: string) => {
  const store = getDefaultStore();
  store.set(temp_user_atom, user);
};

export const useTempUser = () => {
  const [user, setUser] = useAtom(temp_user_atom);
  return [user, setUser] as const;
};
export const clear_temp_user = () => {
  const store = getDefaultStore();
  store.set(temp_user_atom, null);
};

const auth_logout = async () => {
  const session = get_user_value()?.sessionId;
  let resp = await apiClient.delete("auth/sessions/" + session);
  return resp.data;
};

export const refresh_kyc = async () => {
  let resp = await apiClient.get<ApiResponse>("/users/profile");
  set_kyc_value(resp.data.data);
  return resp.data;
};
export const logout = () => {
  toast.promise(auth_logout, {
    loading: "loading",
    success: () => {
      clear_user();
      window.location.href = "/login";
      return "success";
    },
    error: extract_message,
  });
};

export const show_logout = () => {
  const modal = document.getElementById("logout_modal") as HTMLDialogElement;
  modal.showModal();
};
