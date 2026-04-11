import { apiFetch } from "api/client";
import type { UserContext } from "types/context";

export function getMe(token: string): Promise<UserContext> {
  return apiFetch<UserContext>("/context", token);
}
