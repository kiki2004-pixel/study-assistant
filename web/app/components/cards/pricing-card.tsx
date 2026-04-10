import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";

export interface PricingTier {
  name: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  volume: string;
  price: string;
  perEmail: string;
  highlight: boolean;
  contactUs?: boolean;
}

export function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <Flex
      direction="column"
      bg={tier.highlight ? "fg" : "bg.subtle"}
      border="1px solid"
      borderColor={tier.highlight ? "fg" : "border"}
      borderRadius="2xl"
      p={6}
      gap={4}
      position="relative"
    >
      {/* Header */}
      <Flex justify="space-between" align="flex-start">
        <Heading
          fontSize="xl"
          fontWeight="semibold"
          color={tier.highlight ? "bg" : "fg"}
        >
          {tier.name}
        </Heading>
        <Box
          bg={tier.badgeBg}
          color={tier.badgeColor}
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.05em"
          px={2.5}
          py={1}
          borderRadius="full"
          border={tier.highlight ? "none" : "1px solid"}
          borderColor="border"
        >
          {tier.badge}
        </Box>
      </Flex>

      {/* Volume */}
      <Text
        fontSize="sm"
        color={tier.highlight ? "bg" : "fg.muted"}
        opacity={tier.highlight ? 0.7 : 1}
      >
        {tier.volume}
      </Text>

      {/* Price */}
      <Box mt={2}>
        <Text
          fontSize="4xl"
          fontWeight="bold"
          color={tier.highlight ? "bg" : "fg"}
          lineHeight={1}
        >
          {tier.price}
        </Text>
        <Text
          fontSize="sm"
          color={tier.highlight ? "bg" : "fg.muted"}
          opacity={tier.highlight ? 0.6 : 1}
          mt={1}
        >
          {tier.perEmail}
        </Text>
      </Box>

      {/* Spacer */}
      <Box flex={1} />

      {/* CTA */}
      <Flex direction="column" gap={2} mt={4}>
        <Button
          size="md"
          bg={tier.highlight ? "brand.solid" : "fg"}
          color={tier.highlight ? "brand.contrast" : "bg"}
          borderRadius="lg"
          fontWeight="semibold"
          _hover={{ opacity: 0.9 }}
          w="full"
        >
          Get Started <FiArrowRight />
        </Button>
        {tier.contactUs && (
          <Text
            fontSize="xs"
            color="fg.muted"
            textAlign="center"
            cursor="pointer"
            _hover={{ color: "fg" }}
          >
            Need more? Contact us
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
