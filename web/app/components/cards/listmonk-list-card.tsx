import { Badge, Box, Button, Flex, Text } from "@chakra-ui/react";
import { FiUsers, FiZap } from "react-icons/fi";
import type { ListmonkList } from "@types/integrations";

interface ListmonkListCardProps {
  list: ListmonkList;
}

export function ListmonkListCard({ list }: ListmonkListCardProps) {
  return (
    <Flex
      direction="column"
      gap={3}
      p={4}
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.subtle"
    >
      <Flex align="flex-start" justify="space-between" gap={2}>
        <Box minW={0}>
          <Text fontSize="sm" fontWeight="500" truncate mb={0.5}>
            {list.name}
          </Text>
          <Flex align="center" gap={1.5}>
            <Box color="fg.muted">
              <FiUsers size={11} />
            </Box>
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              {list.subscriber_count.toLocaleString()} subscribers
            </Text>
          </Flex>
        </Box>
        {list.type && (
          <Badge
            size="sm"
            variant="subtle"
            borderRadius="full"
            px={2}
            fontSize="10px"
            flexShrink={0}
            textTransform="capitalize"
          >
            {list.type}
          </Badge>
        )}
      </Flex>
      <Button
        size="xs"
        variant="outline"
        borderColor="border"
        borderRadius="md"
        fontWeight="500"
        alignSelf="flex-start"
        gap={1.5}
        disabled
        title="Coming soon"
      >
        <FiZap size={11} />
        Validate list
      </Button>
    </Flex>
  );
}
