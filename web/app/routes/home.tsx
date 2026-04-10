import { useAuth } from "react-oidc-context";
import { Box, Container, Heading, Text } from "@chakra-ui/react";
import { AuthenticatedNavbar } from "~/components/navbar/AuthenticatedNavbar";
import { UnauthenticatedNavbar } from "~/components/navbar/UnauthenticatedNavbar";
import { Footer } from "~/components/Footer";

export default function Home() {
  const auth = useAuth();

  return (
    <Box minH="100vh" bg="bg" display="flex" flexDirection="column">
      {auth.isAuthenticated ? (
        <AuthenticatedNavbar />
      ) : (
        <UnauthenticatedNavbar />
      )}

      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="bg"
      >
        <Container maxW="3xl" textAlign="center">
          <Heading>
            Remove invalid recipients, block fake users and bots, prevent fraud,
            and help you save money.
          </Heading>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
