import { Box, Heading, Text } from "@chakra-ui/react";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Box mb={10}>
      <Box mb={5} pb={3} borderBottomWidth="1px" borderColor="border">
        <Heading fontSize="md" fontWeight="600" letterSpacing="-0.01em">
          {title}
        </Heading>
        {description && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {description}
          </Text>
        )}
      </Box>
      {children}
    </Box>
  );
}
