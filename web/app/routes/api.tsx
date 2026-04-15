import { Box, Container, Heading, Text } from "@chakra-ui/react";

export default function Api() {
  return (
    <Container maxW="7xl" py={10}>
      <Box mb={8}>
        <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mb={1}>
          API
        </Heading>
        <Text color="fg.muted">Your API keys and usage metrics.</Text>
      </Box>
    </Container>
  );
}
