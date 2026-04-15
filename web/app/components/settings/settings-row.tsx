import { Box, Flex, Text } from "@chakra-ui/react";

export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      py={4}
      borderBottomWidth="1px"
      borderColor="border"
      gap={{ base: 4, md: 8 }}
      _last={{ borderBottom: "none" }}
    >
      <Box>
        <Text fontSize="sm" fontWeight="500">
          {label}
        </Text>
        {description && (
          <Text fontSize="xs" color="fg.muted" mt={0.5} lineHeight={1.5}>
            {description}
          </Text>
        )}
      </Box>
      <Box flexShrink={0}>{children}</Box>
    </Flex>
  );
}
