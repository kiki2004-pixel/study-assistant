import { Box, Code, Container, Flex, Icon, Link, Text } from "@chakra-ui/react";
import { FiMail } from "react-icons/fi";

export function Footer() {
  return (
    <Box py={8} bg="bg" borderTopWidth="1px" borderColor="border">
      <Container maxW="6xl">
        <Flex justify="center" align="center" direction="column" gap={2}>
          <Flex align="center" gap={2}>
            <Icon as={FiMail} color="fg.muted" boxSize={4} />
            <Text color="fg.muted" fontSize="sm">
              Scrub — open-source email hygiene tooling
            </Text>
          </Flex>
          <Code bg="bg" color="fg.muted" fontSize="sm">
            Powered by <Link href="https://n0.rocks" target="_blank" rel="noopener noreferrer">n0.</Link>
          </Code>
        </Flex>
      </Container>
    </Box>
  );
}
