import { apiDelete, apiFetch, apiPost, apiPut } from "./client";
import type {
  ConnectionTestResult,
  Integration,
  ListmonkList,
} from "@types/integrations";

export function getListmonkIntegration(): Promise<Integration> {
  return apiFetch<Integration>("/listmonk/integration");
}

export function saveListmonkIntegration(
  url: string,
  username: string,
  api_token: string,
): Promise<Integration> {
  return apiPut<Integration>("/listmonk/integration", {
    body: JSON.stringify({ url, username, api_token }),
  });
}

export function deleteListmonkIntegration(): Promise<void> {
  return apiDelete("/listmonk/integration");
}

export function testListmonkIntegration(): Promise<ConnectionTestResult> {
  return apiPost<ConnectionTestResult>("/listmonk/integration/test", {});
}

export function getListmonkLists(): Promise<ListmonkList[]> {
  return apiFetch<ListmonkList[]>("/listmonk/integration/lists");
}
