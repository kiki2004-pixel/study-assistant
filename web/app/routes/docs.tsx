import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react";
import { ApiKeysSection } from "@app/components/docs/sections/api-keys-section";
import { AuthenticationSection } from "@app/components/docs/sections/authentication-section";
import { HistorySection } from "@app/components/docs/sections/history-section";
import { ValidationSection } from "@app/components/docs/sections/validation-section";
import { WebhooksSection } from "@app/components/docs/sections/webhooks-section";
import { NavItem } from "@app/components/docs/nav-item";

export default function Docs() {
  return (
    <Container maxW="7xl" py={10}>
      <Flex gap={10} align="flex-start">
        {/* Sidebar */}
        <Box
          w="200px"
          flexShrink={0}
          display={{ base: "none", lg: "block" }}
          position="sticky"
          top={8}
        >
          <Text
            fontSize="xs"
            fontWeight="600"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="0.06em"
            mb={3}
          >
            Reference
          </Text>
          <NavItem href="#authentication" label="Authentication" />
          <NavItem href="#validation" label="Validation" />
          <NavItem href="#history" label="History" />
          <NavItem href="#api-keys" label="API Keys" />
          <NavItem href="#webhooks" label="Webhooks" />
        </Box>

        {/* Content */}
        <Box flex={1} minW={0}>
          <Box mb={10}>
            <Heading
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="400"
              letterSpacing="-0.02em"
              mb={2}
            >
              API Reference
            </Heading>
            <Text color="fg.muted" fontSize="sm" maxW="560px">
              Scrub validates email addresses via REST. Integrate with your
              product using an API key — no OAuth flow required.
            </Text>
          </Box>

          <AuthenticationSection />
          <ValidationSection />
          <HistorySection />
          <ApiKeysSection />
          <WebhooksSection />
        </Box>
      </Flex>
    </Container>
  );
}
