import { Badge, Box, Flex, Text } from "@chakra-ui/react";
import { STATUS_CONFIG, VALIDATED_EMAILS } from "@lib/const";

export function ValidatedListCard() {
  const valid = VALIDATED_EMAILS.filter((e) => e.status === "valid").length;

  return (
    <Box
      bg="bg.subtle"
      border="1px solid"
      borderColor="fg"
      borderRadius="2xl"
      overflow="hidden"
      shadow="sm"
    >
      {/* Header */}
      <Box px={4} pt={4} pb={3} borderBottomWidth="1px" borderColor="border">
        <Text
          fontSize="9px"
          fontWeight="semibold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="fg.muted"
          mb={2}
        >
          After Scrub
        </Text>
        <Flex align="center" justify="space-between">
          <Text fontSize="xs" fontWeight="semibold" color="fg">
            Validated
          </Text>
          <Badge
            colorPalette="green"
            variant="subtle"
            fontSize="10px"
            borderRadius="full"
            px={2}
            py={0.5}
          >
            ✓ Clean · {valid}/{VALIDATED_EMAILS.length}
          </Badge>
        </Flex>
      </Box>

      {/* Email rows */}
      <Box px={4} py={3}>
        <Flex direction="column" gap={1.5}>
          {VALIDATED_EMAILS.map((row, i) => {
            const cfg = STATUS_CONFIG[row.status];
            return (
              <Flex key={i} align="center" justify="space-between" gap={2}>
                <Flex align="center" gap={2.5} flex={1} minW={0}>
                  <Box
                    w={1.5}
                    h={1.5}
                    borderRadius="full"
                    bg={cfg.color}
                    flexShrink={0}
                  />
                  <Text fontSize="xs" fontFamily="mono" color="fg" truncate>
                    {row.email}
                  </Text>
                </Flex>
                <Badge
                  colorPalette={
                    row.status === "valid"
                      ? "green"
                      : row.status === "duplicate"
                        ? "yellow"
                        : "red"
                  }
                  variant="subtle"
                  fontSize="10px"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  flexShrink={0}
                >
                  {cfg.label}
                </Badge>
              </Flex>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
}
