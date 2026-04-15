import { Badge } from "@chakra-ui/react";

export function StatusBadge({ isValid }: { isValid: boolean }) {
  return (
    <Badge
      px={2}
      py={0.5}
      borderRadius="full"
      fontSize="xs"
      fontWeight={500}
      bg={isValid ? "valid.bg" : "invalid.bg"}
      color={isValid ? "valid.fg" : "invalid.fg"}
      border="1px solid"
      borderColor={isValid ? "valid.border" : "invalid.border"}
    >
      {isValid ? "Valid" : "Invalid"}
    </Badge>
  );
}
