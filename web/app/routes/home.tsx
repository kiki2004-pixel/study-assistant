import { useAuth } from "react-oidc-context";
import { Box, Container, Heading, Text } from "@chakra-ui/react";
import { AuthenticatedNavbar } from "~/components/navbar/AuthenticatedNavbar";
import { UnauthenticatedNavbar } from "~/components/navbar/UnauthenticatedNavbar";
import { Footer } from "~/components/Footer";

export default function Home() {
  const auth = useAuth();

  return (
    <Box minH="100vh" bg="bg" display="flex" flexDirection="column">
      {auth.isAuthenticated ? <AuthenticatedNavbar /> : <UnauthenticatedNavbar />}

      <Box flex={1} display="flex" alignItems="center" justifyContent="center" bg="bg">
        <Container maxW="3xl" textAlign="center">
          <Heading
            fontSize={{ base: "4xl", md: "6xl" }}
            fontWeight="extrabold"
            letterSpacing="tight"
            lineHeight="1.1"
            mb={5}
          >
            Validate Emails{" "}
            <Box as="span" color="brand.solid">
              at Scale
            </Box>
          </Heading>
          <Text color="fg.muted" fontSize={{ base: "lg", md: "xl" }}>
            Keep your mailing lists clean and your deliverability high.
          </Text>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
