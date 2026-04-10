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
        fontFamily="heading"
        fontWeight="400"
        fontSize={{ base: "3xl", md: "4xl" }}
        letterSpacing="-0.03em"
      >
        How it Works
      </Heading>
    </Box>
  );
}
