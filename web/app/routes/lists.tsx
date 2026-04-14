import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { Box, Container, Heading, Text } from "@chakra-ui/react";
import { AuthenticatedNavbar } from "@app/components/navbar/authenticated-navbar";

export default function Lists() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  if (auth.isLoading || !auth.isAuthenticated) {
    return null;
  }

  return (
    <Box minH="100vh" bg="bg">
      <AuthenticatedNavbar />
      <Container maxW="7xl" py={10}>
        <Box mb={8}>
          <Heading
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            mb={1}
          >
            Lists
          </Heading>
          <Text color="fg.muted">
            Manage your email lists and scrubbing jobs.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}
