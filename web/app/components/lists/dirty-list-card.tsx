import { Badge, Box, Flex, Text } from "@chakra-ui/react";
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
      {/* Header */}
      <Box px={4} pt={4} pb={3} borderBottomWidth="1px" borderColor="border">
        <Text
          fontSize="9px"
          fontWeight="semibold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="fg.muted"
          mb={2}
        >
          Before Scrub
        </Text>
        <Flex align="center" justify="space-between">
          <Text fontSize="xs" fontWeight="semibold" color="fg">
            Email List
          </Text>
          <Badge
            colorPalette="red"
            variant="subtle"
            fontSize="10px"
            borderRadius="full"
            px={2}
            py={0.5}
          >
            ⚠ Unvalidated
          </Badge>
        </Flex>
      </Box>

      {/* Email rows */}
      <Box px={4} py={3}>
        <Flex direction="column" gap={1.5}>
          {DIRTY_EMAILS.map((email, i) => {
            const isInvalid =
              !email.includes("@") ||
              email.startsWith("@") ||
              !email.split("@")[1];
            return (
              <Flex key={i} align="center" gap={2.5}>
                <Box
                  w={1.5}
                  h={1.5}
                  borderRadius="full"
                  bg={isInvalid ? "red.400" : "fg.muted"}
                  flexShrink={0}
                />
                <Text
                  fontSize="xs"
                  fontFamily="mono"
                  color={isInvalid ? "red.500" : "fg"}
                  truncate
                >
                  {email}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
}
