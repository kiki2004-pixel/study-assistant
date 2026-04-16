import { Container, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function AuthCallback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // react-oidc-context automatically processes the OIDC redirect callback
    // (signinRedirectCallback) when it detects code/state in the URL.
    // Once loading is complete and the user is authenticated, navigate to dashboard.
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate("/dashboard");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);
  if (auth.error) {
    return (
      <Container maxW="md" centerContent py="20">
        <VStack gap="4">
          <Text color="red.500">
            Authentication error: {auth.error.message}
          </Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="md" centerContent py="20">
      <VStack gap="4">
        <Spinner size="lg" />
        <Text color="fg.muted">Signing in…</Text>
      </VStack>
    </Container>
  );
}
