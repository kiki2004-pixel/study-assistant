import { apiFetch } from "api/client";
import type { HistoryPage, HistoryParams } from "types/history";

export function getHistory(
  token: string,
  params: HistoryParams = {},
): Promise<HistoryPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.is_valid !== undefined)
    query.set("is_valid", String(params.is_valid));
  if (params.email) query.set("email", params.email);
  if (params.request_id) query.set("request_id", params.request_id);
  return apiFetch<HistoryPage>(`/validation/history?${query}`, token);
}
