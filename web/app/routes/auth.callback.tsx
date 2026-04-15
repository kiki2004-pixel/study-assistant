import { Container, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function AuthCallback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const completeSignin = async () => {
      try {
        // If already authenticated (e.g. callback handled elsewhere), just navigate.
        if (auth.isAuthenticated) {
          navigate("/dashboard");
          return;
        }

        // Explicitly process the OIDC redirect response if a UserManager is available.
        if (auth.userManager) {
          await auth.userManager.signinRedirectCallback();
          if (!isMounted) {
            return;
          }
          navigate("/dashboard");
        }
      } catch (e) {
        // Let react-oidc-context surface the error via auth.error; also log for debugging.

        console.error("Error handling sign-in callback", e);
      }
    };

    completeSignin();

    return () => {
      isMounted = false;
    };
  }, [auth.isAuthenticated, auth.userManager, navigate]);
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
