import { apiPost } from "api/client";
import type { ValidationResult } from "types/validation";

export function validateEmail(email: string): Promise<ValidationResult> {
  return apiPost<ValidationResult>(
    `/validation/validate-single?email=${encodeURIComponent(email)}`,
  );
}
