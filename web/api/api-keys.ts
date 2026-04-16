import { apiDelete, apiFetch, apiPost } from "./client";

export interface ApiKey {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string | null;
  active: boolean;
}

export interface CreatedApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string;
}

export function listApiKeys(): Promise<ApiKey[]> {
  return apiFetch<ApiKey[]>("/api-keys");
}

export function createApiKey(name: string): Promise<CreatedApiKey> {
  return apiPost<CreatedApiKey>("/api-keys", {
    body: JSON.stringify({ name }),
  });
}

export function revokeApiKey(id: number): Promise<void> {
  return apiDelete(`/api-keys/${id}`);
}
