import { apiFetch } from "./client";

export interface JobProgressResponse {
  request_id: string;
  status: string;
  total_items: number;
  processed_items: number;
  valid_count: number;
  invalid_count: number;
  error_count: number;
  progress_percentage: number;
  is_complete: boolean;
  error_message: string | null;
}

export interface ActiveJobItem {
  request_id: string;
  job_type: string;
  status: string;
  list_name: string | null;
  total_items: number;
  processed_items: number;
  progress_percentage: number;
  created_at: string;
}

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
