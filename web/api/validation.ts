import { apiFetch } from "api/client";
import type { ValidationResult } from "types/validation";

export function validateEmail(email: string, token: string): Promise<ValidationResult> {
  return apiFetch<ValidationResult>(
    `/validation/validate-single?email=${encodeURIComponent(email)}`,
    token,
    { method: "POST" },
  );
}
