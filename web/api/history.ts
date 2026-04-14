import { apiFetch } from "api/client";
import type { HistoryEntry, HistoryPage, HistoryParams } from "types/history";

export function getHistory(
  token: string,
  params: HistoryParams = {},
): Promise<HistoryPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.is_valid !== undefined)
    query.set("is_valid", String(params.is_valid));
  return apiFetch<HistoryPage>(`/validation/history?${query}`, token);
}

export function getEmailHistory(
  token: string,
  email: string,
): Promise<HistoryEntry[]> {
  return apiFetch<HistoryEntry[]>(
    `/validation/history/${encodeURIComponent(email)}`,
    token,
  );
}

export function getBulkHistory(
  token: string,
  requestId: string,
): Promise<HistoryEntry[]> {
  return apiFetch<HistoryEntry[]>(
    `/validation/history/bulk/${requestId}`,
    token,
  );
}
