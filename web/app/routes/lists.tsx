import { Box, Container, Heading, Text } from "@chakra-ui/react";

export default function Lists() {
  return (
    <Container maxW="7xl" py={10}>
      <Box mb={8}>
        <Heading
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="400"
          fontFamily="mono"
          letterSpacing="-0.02em"
          mb={1}
        >
          Lists
        </Heading>
        <Text color="fg.muted">
          Manage your email lists and scrubbing jobs.
        </Text>
      </Box>
    </Container>
  );
}
