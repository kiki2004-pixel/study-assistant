import { Box, Flex, Text } from "@chakra-ui/react";
import { MethodBadge } from "./method-badge";

export function Endpoint({
  method,
  path,
  description,
  children,
}: {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="md"
      overflow="hidden"
      mb={4}
    >
      <Flex align="center" gap={3} px={4} py={3} bg="bg.subtle">
        <MethodBadge method={method} />
        <Text fontFamily="mono" fontSize="sm" fontWeight="500" color="fg">
          {path}
        </Text>
      </Flex>
      <Box px={4} py={3} borderTopWidth="1px" borderColor="border">
        <Text fontSize="sm" color="fg.muted" mb={children ? 4 : 0}>
          {description}
        </Text>
        {children}
      </Box>
    </Box>
  );
}
