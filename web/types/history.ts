export interface HistoryEntry {
  id: number;
  email: string;
  validated_at: string;
  is_valid: boolean;
  quality_score: number | null;
  checks: Record<string, boolean> | null;
  attributes: Record<string, unknown> | null;
  request_id: string | null;
  user_id: string | null;
}

export interface HistoryParams {
  page?: number;
  page_size?: number;
  is_valid?: boolean;
}

export interface HistoryPage {
  total: number;
  page: number;
  page_size: number;
  results: HistoryEntry[];
}
