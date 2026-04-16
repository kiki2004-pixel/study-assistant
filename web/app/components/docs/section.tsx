import { Box, Heading } from "@chakra-ui/react";

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box mb={12} id={id}>
      <Heading
        fontSize="lg"
        fontWeight="600"
        letterSpacing="-0.01em"
        mb={5}
        pb={3}
        borderBottomWidth="1px"
        borderColor="border"
      >
        {title}
      </Heading>
      {children}
    </Box>
  );
}
