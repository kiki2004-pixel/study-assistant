import { Box, Container, Heading, Text } from "@chakra-ui/react";

export default function Docs() {
  return (
    <Container maxW="7xl" py={10}>
      <Box mb={8}>
        <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mb={1}>
          Docs
        </Heading>
        <Text color="fg.muted">Guides and references for using Scrub.</Text>
      </Box>
    </Container>
  );
}
