import { Box, Flex, Text } from "@chakra-ui/react";

export function QualityBar({ score }: { score: number }) {
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm" color="fg.muted">
          Email quality score
        </Text>
        <Text fontSize="sm" fontWeight="semibold" fontFamily="mono">
          {score}%
        </Text>
      </Flex>
      <Flex justify="space-between" mb={1}>
        {[0, 25, 50, 75, 100].map((n) => (
          <Text key={n} fontSize="xs" color="fg.muted" fontFamily="mono">
            {n}
          </Text>
        ))}
      </Flex>
      <Box position="relative" h="8px" borderRadius="full" overflow="hidden">
        {/* gradient track */}
        <Box
          position="absolute"
          inset={0}
          bgGradient="to-r"
          gradientFrom="red.500"
          gradientVia="yellow.400"
          gradientTo="green.500"
        />
        {/* mask that covers the right portion */}
        <Box
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          w={`${100 - score}%`}
          bg="bg.muted"
          opacity={0.85}
        />
        {/* indicator */}
        <Box
          position="absolute"
          top="50%"
          left={`${score}%`}
          transform="translate(-50%, -50%)"
          w="3px"
          h="12px"
          bg="fg"
          borderRadius="full"
        />
      </Box>
    </Box>
  );
}
