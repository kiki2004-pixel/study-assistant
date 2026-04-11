import { Badge, Box, Flex, Icon, Text } from "@chakra-ui/react";
import { FiAlertTriangle, FiCheck, FiX } from "react-icons/fi";
import type { ValidationResult } from "api/validation";

const STATUS_COLOR: Record<string, string> = {
  deliverable: "green",
  undeliverable: "red",
  risky: "yellow",
  unknown: "gray",
};

const STATUS_TITLE: Record<string, string> = {
  deliverable: "Deliverable email",
  undeliverable: "Undeliverable email",
  risky: "Risky email",
  unknown: "Unknown",
};

const STATUS_DESC: Record<string, string> = {
  deliverable: "This email address appears valid and can receive mail.",
  undeliverable: "This email address cannot receive mail.",
  risky: "This email exists but is flagged as risky (disposable or catch-all).",
  unknown: "We could not determine the deliverability of this address.",
};

const REASON_LABEL: Record<string, string> = {
  MAIL_SERVER_FOUND: "MX record confirmed — domain accepts mail",
  MAIL_SERVER_FOUND_FALLBACK: "No MX record, A record used as fallback",
  NO_MAIL_SERVER_CONFIGURED: "Domain has no mail server configured",
  DNS_ERROR_FAIL_SAFE: "DNS timed out — allowed through as fail-safe",
};

function CheckRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: boolean;
  warn?: boolean;
}) {
  const isWarning = warn && !value;
  return (
    <Flex
      align="center"
      justify="space-between"
      py={2}
      borderBottomWidth="1px"
      borderColor="border"
      _last={{ borderBottom: "none" }}
    >
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Flex align="center" gap={1}>
        {isWarning && (
          <Icon as={FiAlertTriangle} color="red.400" boxSize={3.5} />
        )}
        <Text
          fontSize="sm"
          fontWeight="medium"
          color={value ? "fg" : isWarning ? "red.500" : "fg.muted"}
        >
          {value ? "Yes" : "No"}
        </Text>
      </Flex>
    </Flex>
  );
}

function AttrRow({
  label,
  value,
}: {
  label: string;
  value?: string | boolean | null;
}) {
  const display =
    value === undefined || value === null || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : value;

  return (
    <Flex
      align="center"
      justify="space-between"
      py={2}
      borderBottomWidth="1px"
      borderColor="border"
      _last={{ borderBottom: "none" }}
    >
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="sm" fontFamily="mono" color="fg">
        {display}
      </Text>
    </Flex>
  );
}

function QualityBar({ score }: { score: number }) {
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm" color="fg.muted">
          Email quality score
        </Text>
        <Text fontSize="sm" fontWeight="semibold" fontFamily="mono">
          {score}%
        </Text>
      </Flex>
      <Flex justify="space-between" mb={1}>
        {[0, 25, 50, 75, 100].map((n) => (
          <Text key={n} fontSize="xs" color="fg.muted" fontFamily="mono">
            {n}
          </Text>
        ))}
      </Flex>
      <Box position="relative" h="8px" borderRadius="full" overflow="hidden">
        {/* gradient track */}
        <Box
          position="absolute"
          inset={0}
          bgGradient="to-r"
          gradientFrom="red.500"
          gradientVia="yellow.400"
          gradientTo="green.500"
        />
        {/* mask that covers the right portion */}
        <Box
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          w={`${100 - score}%`}
          bg="bg.muted"
          opacity={0.85}
        />
        {/* indicator */}
        <Box
          position="absolute"
          top="50%"
          left={`${score}%`}
          transform="translate(-50%, -50%)"
          w="3px"
          h="12px"
          bg="fg"
          borderRadius="full"
        />
      </Box>
    </Box>
  );
}

export function ValidationResultCard({ result }: { result: ValidationResult }) {
  const { status, checks, attributes, quality_score, reason } = result;
  const colorScheme = STATUS_COLOR[status] ?? "gray";

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
          {STATUS_TITLE[status] ?? status}
        </Badge>
        <Text fontSize="sm" color="fg.muted">
          {reason ? (REASON_LABEL[reason] ?? reason) : STATUS_DESC[status]}
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
