import { Box, Container, SimpleGrid } from "@chakra-ui/react";
import { DirtyListCard } from "@app/components/cards/dirty-list-card";
import { ValidatorInputCard } from "@app/components/cards/validator-input-card";
import { ValidatedListCard } from "@app/components/cards/validated-list-card";

export function FeatureCardsSection() {
  return (
    <Box pb={24} pt={2}>
      <Container maxW="6xl">
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={5} alignItems="center">
          <Box
            display={{ base: "none", lg: "block" }}
            transform="scale(0.78)"
            transformOrigin="center"
            opacity={0.45}
            transition="opacity 0.2s, transform 0.2s"
            _hover={{ opacity: 0.7, transform: "scale(0.82)" }}
          >
            <DirtyListCard />
          </Box>
          <ValidatorInputCard />
          <Box
            display={{ base: "none", lg: "block" }}
            transform="scale(0.78)"
            transformOrigin="center"
            opacity={0.45}
            transition="opacity 0.2s, transform 0.2s"
            _hover={{ opacity: 0.7, transform: "scale(0.82)" }}
          >
            <ValidatedListCard />
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
