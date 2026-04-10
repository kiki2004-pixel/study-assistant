import { Flex, Text } from "@chakra-ui/react";

export function PricingComingSoonCard({ highlight }: { highlight?: boolean }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      bg={highlight ? "fg" : "bg.subtle"}
      border="1px solid"
      borderColor={highlight ? "fg" : "border"}
      borderRadius="2xl"
      p={6}
      minH="280px"
      gap={3}
    >
      <Text
        fontSize="lg"
        fontWeight="semibold"
        color={highlight ? "bg" : "fg"}
        opacity={highlight ? 0.5 : 0.4}
      >
        Coming soon
      </Text>
      <Text
        fontSize="sm"
        color={highlight ? "bg" : "fg.muted"}
        opacity={highlight ? 0.4 : 1}
        textAlign="center"
      >
        Monthly plans are on the way
      </Text>
    </Flex>
  );
}
