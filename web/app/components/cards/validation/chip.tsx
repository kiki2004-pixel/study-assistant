import { Flex, Text } from "@chakra-ui/react";

export function Chip({ label }: { label: string }) {
  return (
    <Flex
      align="center"
      gap={1}
      bg="green.50"
      _dark={{ bg: "green.950" }}
      border="1px solid"
      borderColor="green.200"
      _dark-borderColor="green.800"
      borderRadius="full"
      px={2}
      py={0.5}
    >
      <Text
        fontSize="9px"
        color="green.700"
        _dark={{ color: "green.300" }}
        fontWeight="medium"
      >
        {label}
      </Text>
    </Flex>
  );
}
