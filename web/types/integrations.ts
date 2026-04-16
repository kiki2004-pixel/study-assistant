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
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  subscriber_count: number | null;
}
