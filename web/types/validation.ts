export interface ValidationChecks {
  valid_format: boolean;
  valid_domain: boolean;
  can_receive_email: boolean;
  is_disposable: boolean;
  is_generic: boolean;
}

export interface ValidationAttributes {
  username: string;
  domain: string;
  is_free: boolean;
  is_disposable: boolean;
  is_generic: boolean;
  provider?: string;
  mx_record?: string;
}

export interface ValidationDetails {
  mx_found?: boolean;
  a_found?: boolean;
  mx_host?: string;
  message?: string;
}

export interface ValidationResult {
  email: string;
  status: "deliverable" | "undeliverable" | "risky" | "unknown";
  reason?: string;
  details: ValidationDetails;
  checks: ValidationChecks;
  attributes: ValidationAttributes;
  quality_score: number;
}
