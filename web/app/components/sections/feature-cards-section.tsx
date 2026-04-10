import { Box, Container, SimpleGrid } from "@chakra-ui/react";
import { DirtyListCard } from "@app/components/cards/dirty-list-card";
import { ValidatorInputCard } from "@app/components/cards/validator-input-card";
import { ValidatedListCard } from "@app/components/cards/validated-list-card";

export function FeatureCardsSection() {
  return (
    <Box pb={24} pt={2}>
      <Container maxW="6xl">
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={5}>
          <Box display={{ base: "none", lg: "block" }}>
            <DirtyListCard />
          </Box>
          <ValidatorInputCard />
          <Box display={{ base: "none", lg: "block" }}>
            <ValidatedListCard />
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
