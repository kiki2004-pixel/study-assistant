import { apiFetch } from "api/client";
import type { UserInfo } from "types/context";

export function getMe(token: string): Promise<UserInfo> {
  return apiFetch<UserInfo>("/user/me", token);
}
