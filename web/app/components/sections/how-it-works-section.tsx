import { Box, Container, Flex, Grid, Heading, Text } from "@chakra-ui/react";

const features = [
  {
    title: "Format check",
    text: "Catch typos and malformed addresses before they enter your list.",
  },
  {
    title: "Delivery check",
    text: "Verify the domain has working MX records and can receive mail.",
  },
  {
    title: "Email profiling",
    text: "Identify role-based, catch-all, and high-risk address patterns.",
  },
  {
    title: "Blocklists",
    text: "Flag addresses and domains known for spam, abuse, or fraud.",
  },
  {
    title: "No-code APIs",
    text: "Drop validation into any form or workflow with a single endpoint.",
  },
  {
    title: "Mailing lists",
    text: "Upload a CSV and clean your entire list in one go.",
  },
];

const stats = [
  { value: "2–7%", label: "of signups contain typos or misspelled domains" },
  {
    value: "5–15%",
    label: "enter a made-up or gibberish address to bypass a gate",
  },
  { value: "10–40%", label: "are bot or spam signups without CAPTCHA or DOI" },
  { value: "3–10%", label: "use disposable or catch-all addresses" },
];

export function HowItWorksSection() {
  return (
    <Box
      py={{ base: 20, md: 32 }}
      mx={{ base: 6, md: 20 }}
      borderTopWidth="1px"
      borderColor="border"
    >
      <Container maxW="5xl" px={0}>
        {/* Header */}
        <Flex
          direction="column"
          align="center"
          textAlign="center"
          gap={6}
          mb={16}
        >
          <Heading
            fontFamily="heading"
            fontWeight="400"
            fontSize={{ base: "3xl", md: "5xl" }}
            letterSpacing="-0.03em"
            lineHeight={1.05}
          >
            How it works
          </Heading>
        </Flex>

        {/* Features list */}
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
          gap={0}
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          overflow="hidden"
          mb={16}
        >
          {features.map((feature) => (
            <Flex
              key={feature.title}
              direction="row"
              align="baseline"
              gap={4}
              px={8}
              py={5}
              bg="bg.subtle"
              borderBottomWidth="1px"
              borderRightWidth="1px"
              borderColor="border"
            >
              <Text
                fontWeight="600"
                fontSize="sm"
                flexShrink={0}
                w="120px"
              >
                {feature.title}
              </Text>
              <Text fontSize="sm" color="fg.muted" lineHeight={1.6}>
                {feature.text}
              </Text>
            </Flex>
          ))}
        </Grid>

        {/* Signup form callout */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          px={10}
          py={8}
          mb={16}
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ md: "center" }}
            justify="space-between"
            gap={4}
          >
            <Box>
              <Text
                fontFamily="heading"
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="400"
                letterSpacing="-0.02em"
                mb={1}
              >
                Place us after your sign up forms and landing pages.
              </Text>
              <Text fontSize="sm" color="fg.muted">
                We'll make sure you only get real users.
              </Text>
            </Box>
            <Box
              flexShrink={0}
              bg="brand.solid"
              color="white"
              border="1px solid"
              borderColor="fg"
              borderRadius="lg"
              px={6}
              py={3}
              fontSize="sm"
              fontWeight="500"
              cursor="pointer"
              whiteSpace="nowrap"
            >
              See the API docs
            </Box>
          </Flex>
        </Box>

        {/* Stats row */}
        <Grid
          templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
          gap={8}
        >
          {stats.map((stat) => (
            <Flex key={stat.value} direction="column" gap={1}>
              <Text
                fontFamily="mono"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="600"
                color="fg"
                letterSpacing="-0.02em"
              >
                {stat.value}
              </Text>
              <Text fontSize="sm" color="fg.muted" lineHeight={1.5}>
                {stat.label}
              </Text>
            </Flex>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
