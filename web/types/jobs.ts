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

export interface ActiveValidationJob {
  requestId: string;
  jobType: string;
  status: string;
  listName: string | null;
  totalItems: number;
  processedItems: number;
  progressPercentage: number;
  createdAt: string;
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
