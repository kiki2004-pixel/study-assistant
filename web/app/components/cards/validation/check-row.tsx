import { Flex, Icon, Text } from "@chakra-ui/react";
import { FiAlertTriangle } from "react-icons/fi";

export function CheckRow({
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
