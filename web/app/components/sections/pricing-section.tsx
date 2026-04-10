import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Tabs,
  Text,
} from "@chakra-ui/react";
import {
  PricingCard,
  type PricingTier,
} from "@app/components/cards/pricing-card";
import { PricingComingSoonCard } from "@app/components/cards/pricing-coming-soon-card";

const paygTiers: PricingTier[] = [
  {
    name: "Starter",
    badge: "BASIC",
    badgeBg: "bg.muted",
    badgeColor: "fg.muted",
    volume: "Up to 1,000 emails",
    price: "$4",
    perEmail: "$0.004 per email",
    highlight: false,
  },
  {
    name: "Pro",
    badge: "MOST POPULAR",
    badgeBg: "brand.solid",
    badgeColor: "brand.contrast",
    volume: "Up to 10,000 emails",
    price: "$40",
    perEmail: "$0.004 per email",
    highlight: true,
  },
  {
    name: "Enterprise",
    badge: "BEST VALUE",
    badgeBg: "accent.solid",
    badgeColor: "accent.contrast",
    volume: "Up to 100,000 emails",
    price: "$400",
    perEmail: "$0.004 per email",
    highlight: false,
    contactUs: true,
  },
];

export function PricingSection() {
  return (
    <Box py={{ base: 20, md: 32 }} bg="bg" id="pricing">
      <Container maxW="5xl">
        <Flex
          direction="column"
          align="center"
          textAlign="center"
          gap={4}
          mb={12}
        >
          <Heading
            fontFamily="heading"
            fontWeight="400"
            fontSize={{ base: "3xl", md: "5xl" }}
            letterSpacing="-0.03em"
            lineHeight={1.05}
          >
            Simple, transparent pricing
          </Heading>
          <Text color="fg.muted" fontSize={{ base: "sm", md: "md" }} maxW="md">
            Pay only for what you use. No subscriptions. No hidden fees. Credits
            never expire.
          </Text>
        </Flex>

        <Tabs.Root defaultValue="payg" variant="plain">
          <Flex justify="center" mb={10}>
            <Tabs.List
              bg="bg.muted"
              rounded="full"
              p="1"
              border="1px solid"
              borderColor="border"
            >
              <Tabs.Trigger value="payg">Pay-As-You-Go</Tabs.Trigger>
              <Tabs.Trigger value="monthly">Monthly</Tabs.Trigger>
              <Tabs.Indicator rounded="full" />
            </Tabs.List>
          </Flex>

          <Tabs.Content value="payg">
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={5}
              alignItems="stretch"
            >
              {paygTiers.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </Grid>
          </Tabs.Content>

          <Tabs.Content value="monthly">
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={5}
              alignItems="stretch"
            >
              {[false, true, false].map((highlight, i) => (
                <PricingComingSoonCard key={i} highlight={highlight} />
              ))}
            </Grid>
          </Tabs.Content>
        </Tabs.Root>

        <Text
          textAlign="center"
          fontSize="xs"
          color="fg.muted"
          mt={8}
          opacity={0.7}
        >
          All prices are pay-as-you-go. No subscription. No expiry. $0.004 per
          email validation.
        </Text>
      </Container>
    </Box>
  );
}
