import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheck,
  FiXCircle,
} from "react-icons/fi";

// ─── Dirty list demo data ─────────────────────────────────────────────────────

export const DIRTY_EMAILS = [
  "john@gmail.com",
  "JOHN@GMAIL.COM",
  "test123@",
  "not-an-email",
  "user@disposable.xyz",
  "spam_bot@ru.com",
  "john@gmail.com",
  "@missinguser.co",
];

// ─── Validator input placeholder cycling ─────────────────────────────────────

export const PLACEHOLDER_EMAILS = [
  "john.doe@company.com",
  "marketing@startup.io",
  "newsletter@brand.co",
  "user@example.com",
  "contact@business.org",
];

// ─── Validated list demo data ─────────────────────────────────────────────────

export type EmailStatus = "valid" | "duplicate" | "invalid" | "disposable" | "spam";

export type EmailResult = {
  email: string;
  status: EmailStatus;
};

export const VALIDATED_EMAILS: EmailResult[] = [
  { email: "john@gmail.com",      status: "valid" },
  { email: "JOHN@GMAIL.COM",      status: "duplicate" },
  { email: "test123@",            status: "invalid" },
  { email: "user@disposable.xyz", status: "disposable" },
  { email: "spam_bot@ru.com",     status: "spam" },
  { email: "contact@company.io",  status: "valid" },
  { email: "@missinguser.co",     status: "invalid" },
  { email: "hello@realco.com",    status: "valid" },
];

export const STATUS_CONFIG: Record<
  EmailStatus,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  valid:      { icon: FiCheck,         color: "brand.600",  bg: "brand.50",  label: "Valid" },
  duplicate:  { icon: FiAlertCircle,   color: "accent.700", bg: "accent.50", label: "Dupe" },
  invalid:    { icon: FiXCircle,       color: "red.500",    bg: "red.50",    label: "Invalid" },
  disposable: { icon: FiAlertTriangle, color: "orange.500", bg: "orange.50", label: "Disposable" },
  spam:       { icon: FiXCircle,       color: "red.500",    bg: "red.50",    label: "Spam" },
};
