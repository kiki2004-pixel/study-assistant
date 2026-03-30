import { useAuth } from "react-oidc-context";
import { Box, Button, Container, Flex, Icon, Text } from "@chakra-ui/react";
import { FiMail } from "react-icons/fi";

export function AuthenticatedNavbar() {
  const auth = useAuth();

  return (
    <Box borderBottomWidth="1px" borderColor="border" py={4}>
      <Container maxW="6xl">
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Icon as={FiMail} boxSize={5} color="brand.solid" />
            <Text fontWeight="bold" fontSize="lg">
              Scrub
            </Text>
          </Flex>
          <Flex align="center" gap={3}>
<Text
              fontSize="sm"
              color="fg.muted"
              display={{ base: "none", md: "block" }}
            >
              {auth.user?.profile.email}
            </Text>
            <Button
              size="sm"
              variant="outline"
              borderColor="border"
              onClick={() => auth.signoutRedirect()}
            >
              Sign Out
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
