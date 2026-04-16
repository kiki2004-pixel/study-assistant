import { Badge, Flex, Text } from "@chakra-ui/react";

export function Param({
  name,
  type,
  required,
  description,
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <Flex
      gap={3}
      py={2}
      borderBottomWidth="1px"
      borderColor="border"
      _last={{ borderBottomWidth: 0 }}
      flexWrap="wrap"
    >
      <Flex align="center" gap={2} minW="180px">
        <Text fontFamily="mono" fontSize="xs" fontWeight="600" color="fg">
          {name}
        </Text>
        <Text fontFamily="mono" fontSize="10px" color="fg.muted">
          {type}
        </Text>
        {required && (
          <Badge
            size="sm"
            colorPalette="orange"
            variant="subtle"
            borderRadius="full"
            px={1.5}
            fontSize="9px"
          >
            required
          </Badge>
        )}
      </Flex>
      <Text fontSize="xs" color="fg.muted" flex={1}>
        {description}
      </Text>
    </Flex>
  );
}
