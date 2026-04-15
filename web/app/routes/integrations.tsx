import { Box, Container, Heading, Text } from "@chakra-ui/react";

export default function Integrations() {
  return (
    <Container maxW="7xl" py={10}>
      <Box mb={8}>
        <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mb={1}>
          Integrations
        </Heading>
        <Text color="fg.muted">
          Connect Scrub to your favourite tools and platforms.
        </Text>
      </Box>
    </Container>
  );
}
