export type IntegrationType = "listmonk";

export interface Integration {
  id: number;
  url: string;
  username: string;
  created_at: string;
}

export interface ListmonkList {
  id: number;
  name: string;
  subscriber_count: number;
  type: string;
  active_job_request_id?: string | null;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  subscriber_count: number | null;
}

export interface ListValidateResponse {
  job_id: string;
  request_id: string;
  status: string;
}

export interface ValidationProgressResponse {
  request_id: string;
  validated: number;
}
