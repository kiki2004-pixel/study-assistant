import { Box, Button, Container, Flex, Heading, Text } from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";

export function CtaSection() {
  return (
    <Box
      bg="brand.solid"
      py={{ base: 20, md: 32 }}
      position="relative"
      overflow="hidden"
    >
      {/* Accent radial glow */}
      <Box
        position="absolute"
        inset={0}
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 100%, rgba(0,0,0,0.25) 0%, transparent 70%)",
          opacity: 0.15,
        }}
        pointerEvents="none"
      />

      <Container maxW="3xl" position="relative" zIndex={1}>
        <Flex direction="column" align="center" textAlign="center" gap={6}>
          <Heading
            fontFamily="heading"
            fontWeight="400"
            fontSize={{ base: "3xl", md: "5xl" }}
            letterSpacing="-0.03em"
            lineHeight={1.05}
            color="brand.contrast"
          >
            Ready to clean your list?
          </Heading>

          <Text
            color="brand.contrast"
            opacity={0.8}
            fontSize={{ base: "sm", md: "md" }}
            maxW="md"
            lineHeight={1.7}
          >
            Start validating emails in seconds — no credit card required. Keep
            your sender reputation high and your bounce rate low.
          </Text>

          <Button
            size="lg"
            bg="accent.solid"
            color="accent.contrast"
            border="1px solid"
            borderColor="fg"
            borderRadius="lg"
            px={8}
            fontWeight="semibold"
            _hover={{ bg: "accent.600" }}
          >
            Get Started Free <FiArrowRight />
          </Button>
        </Flex>
      </Container>
    </Box>
  );
}
