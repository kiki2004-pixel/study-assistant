import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { FiCheck, FiMail } from "react-icons/fi";
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
      <Flex
        gap={1.5}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor="fg"
        align="center"
        justify="space-between"
      >
        <Flex gap={1.5}>
          <Box w={2.5} h={2.5} borderRadius="full" bg="red.300" />
          <Box w={2.5} h={2.5} borderRadius="full" bg="yellow.300" />
          <Box w={2.5} h={2.5} borderRadius="full" bg="green.300" />
        </Flex>
        <Flex
          align="center"
          gap={1.5}
          bg="brand.50"
          border="1px solid"
          borderColor="brand.200"
          borderRadius="full"
          px={2.5}
          py={0.5}
        >
          <Icon as={FiCheck} boxSize={3} color="brand.600" />
          <Text fontSize="xs" color="brand.700" fontWeight="medium">
            {valid}/{VALIDATED_EMAILS.length} valid
          </Text>
        </Flex>
      </Flex>
      <Box p={4}>
        <Flex direction="column" gap={1}>
          {VALIDATED_EMAILS.map((row, i) => {
            const cfg = STATUS_CONFIG[row.status];
            return (
              <Flex
                key={i}
                align="center"
                justify="space-between"
                px={3}
                py={2}
                borderRadius="lg"
                bg={i % 2 === 0 ? "bg" : "transparent"}
              >
                <Flex align="center" gap={2.5} flex={1} minW={0}>
                  <Icon as={FiMail} boxSize={3.5} color="fg.muted" flexShrink={0} />
                  <Text fontSize="xs" fontFamily="mono" color="fg" truncate>
                    {row.email}
                  </Text>
                </Flex>
                <Flex
                  align="center"
                  gap={1}
                  bg={cfg.bg}
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  flexShrink={0}
                  ml={2}
                >
                  <Icon as={cfg.icon} boxSize={2.5} color={cfg.color} />
                  <Text fontSize="10px" color={cfg.color} fontWeight="medium">
                    {cfg.label}
                  </Text>
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
}
