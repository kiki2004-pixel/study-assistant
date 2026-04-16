import { apiDelete, apiFetch, apiPost, apiPut } from "./client";
import type {
  ConnectionTestResult,
  Integration,
  ListmonkList,
  ListValidateResponse,
  ValidationProgressResponse,
} from "~types/integrations";

export function listListmonkIntegrations(): Promise<Integration[]> {
  return apiFetch<Integration[]>("/listmonk/integrations");
}

export function createListmonkIntegration(
  url: string,
  username: string,
  api_token: string,
): Promise<Integration> {
  return apiPost<Integration>("/listmonk/integrations", {
    body: JSON.stringify({ url, username, api_token }),
  });
}

export function getListmonkIntegration(id: number): Promise<Integration> {
  return apiFetch<Integration>(`/listmonk/integrations/${id}`);
}

export function updateListmonkIntegration(
  id: number,
  url: string,
  username: string,
  api_token: string,
): Promise<Integration> {
  return apiPut<Integration>(`/listmonk/integrations/${id}`, {
    body: JSON.stringify({ url, username, api_token }),
  });
}

export function deleteListmonkIntegration(id: number): Promise<void> {
  return apiDelete(`/listmonk/integrations/${id}`);
}

export function testListmonkIntegration(
  id: number,
): Promise<ConnectionTestResult> {
  return apiPost<ConnectionTestResult>(`/listmonk/integrations/${id}/test`, {});
}

export function getListmonkLists(id: number): Promise<ListmonkList[]> {
  return apiFetch<ListmonkList[]>(`/listmonk/integrations/${id}/lists`);
}

export function validateListmonkList(
  integrationId: number,
  listId: number,
): Promise<ListValidateResponse> {
  return apiPost<ListValidateResponse>(
    `/listmonk/integrations/${integrationId}/lists/${listId}/validate`,
    {},
  );
}

export function getValidationProgress(
  integrationId: number,
  listId: number,
  requestId: string,
): Promise<ValidationProgressResponse> {
  return apiFetch<ValidationProgressResponse>(
    `/listmonk/integrations/${integrationId}/lists/${listId}/progress/${requestId}`,
  );
}
