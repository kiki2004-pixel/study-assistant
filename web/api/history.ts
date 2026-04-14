import { apiFetch } from "api/client";
import type { HistoryEntry, HistoryPage } from "types/history";

const API_KEY = import.meta.env.VITE_API_KEY ?? "";

function apiKeyHeader() {
  return { "X-API-Key": API_KEY };
}

export interface HistoryParams {
  page?: number;
  page_size?: number;
  is_valid?: boolean;
}

export function getHistory(
  token: string,
  params: HistoryParams = {},
): Promise<HistoryPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.is_valid !== undefined)
    query.set("is_valid", String(params.is_valid));
  return apiFetch<HistoryPage>(`/validation/history?${query}`, token, {
    headers: apiKeyHeader(),
  });
}

export function getEmailHistory(
  token: string,
  email: string,
): Promise<HistoryEntry[]> {
  return apiFetch<HistoryEntry[]>(
    `/validation/history/${encodeURIComponent(email)}`,
    token,
    { headers: apiKeyHeader() },
  );
}

export function getBulkHistory(
  token: string,
  requestId: string,
): Promise<HistoryEntry[]> {
  return apiFetch<HistoryEntry[]>(
    `/validation/history/bulk/${requestId}`,
    token,
    { headers: apiKeyHeader() },
  );
}
