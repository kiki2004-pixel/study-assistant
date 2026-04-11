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
      <UnauthenticatedNavbar />
      <HeroSection />
      <FeatureCardsSection />
      <HowItWorksSection />
      <PricingSection />
      <CtaSection />
      <FqaSection />
      <Footer />
    </Box>
  );
}
