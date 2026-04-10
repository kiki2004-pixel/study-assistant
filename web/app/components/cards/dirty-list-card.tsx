import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { FiAlertTriangle, FiMail } from "react-icons/fi";
import { DIRTY_EMAILS } from "@lib/const";

export function DirtyListCard() {
  return (
    <Box
      bg="bg.subtle"
      border="1px solid"
      borderColor="fg"
      borderRadius="2xl"
      overflow="hidden"
      shadow="sm"
    >
      <Flex
        gap={1.5}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor="fg"
        align="center"
        justify="space-between"
      >
        <Flex gap={1.5}>
          <Box w={2.5} h={2.5} borderRadius="full" bg="red.300" />
          <Box w={2.5} h={2.5} borderRadius="full" bg="yellow.300" />
          <Box w={2.5} h={2.5} borderRadius="full" bg="green.300" />
        </Flex>
        <Flex
          align="center"
          gap={1.5}
          bg="accent.50"
          border="1px solid"
          borderColor="accent.200"
          borderRadius="full"
          px={2.5}
          py={0.5}
        >
          <Icon as={FiAlertTriangle} boxSize={3} color="accent.700" />
          <Text fontSize="xs" color="accent.700" fontWeight="medium">
            Unvalidated · {DIRTY_EMAILS.length} rows
          </Text>
        </Flex>
      </Flex>
      <Box p={4}>
        <Flex direction="column" gap={1}>
          {DIRTY_EMAILS.map((email, i) => (
            <Flex
              key={i}
              align="center"
              gap={2.5}
              px={3}
              py={2}
              borderRadius="lg"
              bg={i % 2 === 0 ? "bg" : "transparent"}
            >
              <Icon as={FiMail} boxSize={3.5} color="fg.muted" flexShrink={0} />
              <Text
                fontSize="xs"
                fontFamily="mono"
                color={
                  email.includes("@") &&
                  !email.startsWith("@") &&
                  email.split("@")[1]
                    ? "fg"
                    : "red.500"
                }
                truncate
              >
                {email}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
