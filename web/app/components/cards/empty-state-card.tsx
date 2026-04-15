import { Flex, Text } from "@chakra-ui/react";
import { FiInbox } from "react-icons/fi";

export function EmptyStateCard({ filtered }: { filtered: boolean }) {
  return (
    <Flex direction="column" align="center" justify="center" py={16} gap={2}>
      <FiInbox size={28} color="var(--chakra-colors-fg-muted)" />
      <Text fontSize="sm" fontWeight={500} color="fg">
        No history found
      </Text>
      <Text fontSize="xs" color="fg.muted">
        {filtered
          ? "Try adjusting your filters."
          : "Validated emails will appear here."}
      </Text>
    </Flex>
  );
}
