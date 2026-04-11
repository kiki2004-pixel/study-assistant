import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Text,
} from "@chakra-ui/react";
import {
  FiArrowRight,
  FiCalendar,
  FiFileText,
  FiMail,
  FiMessageSquare,
  FiShield,
} from "react-icons/fi";

function FloatingCard({
  icon,
  iconBg,
  iconColor,
  top,
  left,
  right,
  transform,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  top: string;
  left?: string;
  right?: string;
  transform?: string;
}) {
  return (
    <Box
      position="absolute"
      top={top}
      left={left}
      right={right}
      transform={transform}
      display={{ base: "none", xl: "block" }}
      zIndex={1}
    >
      <Box
        bg="bg.subtle"
        border="1px solid"
        borderColor="border"
        borderRadius="2xl"
        p={3}
        shadow="sm"
      >
        <Flex
          align="center"
          justify="center"
          w={10}
          h={10}
          borderRadius="xl"
          bg={iconBg}
        >
          <Icon as={icon} boxSize={5} color={iconColor} />
        </Flex>
      </Box>
    </Box>
  );
}

export function HeroSection() {
  return (
    <Box position="relative" py={{ base: 16, md: 24 }} overflow="hidden">
      {/* Dot-grid background */}
      <Box
        position="absolute"
        inset={0}
        style={{
          backgroundImage:
            "radial-gradient(circle, #C0C0BA 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
        opacity={0.55}
      />

      {/* Floating icon cards */}
      <FloatingCard
        icon={FiMail}
        iconBg="red.100"
        iconColor="red.400"
        top="14%"
        left="7%"
      />
      <FloatingCard
        icon={FiCalendar}
        iconBg="blue.100"
        iconColor="blue.500"
        top="14%"
        right="7%"
      />
      <FloatingCard
        icon={FiMessageSquare}
        iconBg="purple.100"
        iconColor="purple.500"
        top="50%"
        left="4%"
        transform="translateY(-50%)"
      />
      <FloatingCard
        icon={FiFileText}
        iconBg="brand.100"
        iconColor="brand.600"
        top="50%"
        right="4%"
        transform="translateY(-50%)"
      />

      {/* Centre content */}
      <Container maxW="3xl" textAlign="center" position="relative" zIndex={2}>
        {/*{/* Badge */}
        <Flex justify="center" mb={6}>
          <Flex
            align="center"
            gap={2}
            bg="bg.subtle"
            border="1px solid"
            borderColor="border"
            borderRadius="full"
            px={4}
            py={1.5}
            shadow="sm"
          >
            <Icon as={FiShield} boxSize={3.5} color="fg.muted" />
            <Text
              fontSize="xs"
              fontWeight="medium"
              color="fg.muted"
              letterSpacing="0.01em"
            >
              No credit card required to get started
            </Text>
          </Flex>
        </Flex>
        <Heading
          fontFamily="heading"
          fontWeight="400"
          fontSize={{ base: "3xl", md: "5xl", lg: "6xl" }}
          lineHeight={1.05}
          letterSpacing="-0.03em"
          mb={6}
        >
          Remove{" "}
          <Box as="span" fontStyle="italic" color="red.400">
            invalid
          </Box>{" "}
          emails, block{" "}
          <Box as="span" fontStyle="italic" color="red.400">
            fake
          </Box>{" "}
          users and bots
        </Heading>
        <Text
          color="fg.muted"
          fontSize={{ base: "md", md: "lg" }}
          mb={10}
          maxW="xl"
          mx="auto"
        >
          Validate email lists, protect your sender reputation, prevent fraud,
          and save money on every campaign. Scrub keeps your deliverability
          high.
        </Text>
        <Flex justify="center">
          <Button
            size="lg"
            bg="brand.solid"
            color="brand.contrast"
            border="1px solid"
            borderColor="fg"
            borderRadius="lg"
            px={8}
            fontWeight="semibold"
            _hover={{ bg: "brand.600" }}
          >
            Get Started Free <FiArrowRight />
          </Button>
        </Flex>
      </Container>
    </Box>
  );
}
