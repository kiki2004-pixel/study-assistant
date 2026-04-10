import { Box } from "@chakra-ui/react";
import { UnauthenticatedNavbar } from "@app/components/navbar/unauthenticated-navbar";
import { Footer } from "@app/components/footer";
import { HeroSection } from "@app/components/sections/hero-section";
import { FeatureCardsSection } from "@app/components/sections/feature-cards-section";
import { HowItWorksSection } from "@app/components/sections/how-it-works-section";
import { CtaSection } from "@app/components/sections/cta-section";
import { PricingSection } from "@app/components/sections/pricing-section";
import { FqaSection } from "@app/components/sections/fqa-section";

export default function Home() {
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
