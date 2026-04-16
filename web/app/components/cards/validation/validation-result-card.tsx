import { Badge, Box, Text } from "@chakra-ui/react";
import {
  VALIDATION_REASON_LABEL,
  VALIDATION_STATUS_COLOR,
  VALIDATION_STATUS_DESC,
  VALIDATION_STATUS_TITLE,
} from "@lib/const";
import { AttrRow } from "./attr-row";
import { CheckRow } from "./check-row";
import { QualityBar } from "./quality-bar";
import type { ValidationResult } from "types/validation";

export function ValidationResultCard({ result }: { result: ValidationResult }) {
  const { status, checks, attributes, quality_score, reason } = result;
  const colorScheme = VALIDATION_STATUS_COLOR[status] ?? "gray";

  return (
    <Box
      mt={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border"
      overflow="hidden"
    >
      {/* Header */}
      <Box
        px={5}
        py={4}
        bg={
          status === "deliverable"
            ? "green.50"
            : status === "risky"
              ? "yellow.50"
              : "red.50"
        }
        _dark={{
          bg:
            status === "deliverable"
              ? "green.950"
              : status === "risky"
                ? "yellow.950"
                : "red.950",
        }}
      >
        <Badge colorPalette={colorScheme} mb={2}>
          {VALIDATION_STATUS_TITLE[status] ?? status}
        </Badge>
        <Text fontSize="sm" color="fg.muted">
          {reason
            ? (VALIDATION_REASON_LABEL[reason] ?? reason)
            : VALIDATION_STATUS_DESC[status]}
        </Text>
      </Box>

      {/* Quality checks */}
      <Box px={5} py={4} borderBottomWidth="1px" borderColor="border">
        <Text
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="fg.muted"
          mb={2}
        >
          Quality check
        </Text>
        <CheckRow label="Valid format" value={checks.valid_format} warn />
        <CheckRow label="Valid domain" value={checks.valid_domain} warn />
        <CheckRow
          label="Can receive email"
          value={checks.can_receive_email}
          warn
        />
        <CheckRow
          label="Not a disposable address"
          value={!checks.is_disposable}
          warn
        />
        <CheckRow label="Not a generic address" value={!checks.is_generic} />

        <Box mt={4}>
          <QualityBar score={quality_score} />
        </Box>
      </Box>

      {/* Attributes */}
      <Box px={5} py={4}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="fg.muted"
          mb={2}
        >
          Attributes
        </Text>
        <AttrRow label="Username" value={attributes.username} />
        <AttrRow label="Domain" value={attributes.domain} />
        <AttrRow label="Is free" value={attributes.is_free} />
        <AttrRow label="Provider" value={attributes.provider} />
        <AttrRow label="MX record" value={attributes.mx_record} />
      </Box>
    </Box>
  );
}
