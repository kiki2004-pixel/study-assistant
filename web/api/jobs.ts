import { apiFetch } from "./client";
import type { ActiveJobItem, JobProgressResponse } from "~types/jobs";

export type { ActiveJobItem, JobProgressResponse };

export function getJobProgress(
  requestId: string,
): Promise<JobProgressResponse> {
  return apiFetch<JobProgressResponse>(`/jobs/progress/${requestId}`);
}

export function listActiveJobs(): Promise<ActiveJobItem[]> {
  return apiFetch<ActiveJobItem[]>("/jobs/active");
}

export function listRecentJobs(limit = 50): Promise<ActiveJobItem[]> {
  return apiFetch<ActiveJobItem[]>(`/jobs/recent?limit=${limit}`);
}
