import { Box, Heading } from "@chakra-ui/react";

export function HowItWorksSection() {
  return (
    <Box
      textAlign="center"
      py={16}
      mx={{ base: 6, md: 20 }}
      borderTopWidth="1px"
      borderColor="border"
    >
      <Heading
        fontSize={{ base: "3xl", md: "4xl" }}
        fontWeight="black"
        letterSpacing="-0.02em"
      >
        How it Works
      </Heading>
    </Box>
  );
}
