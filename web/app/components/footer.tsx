import { Box, Container, Flex, Grid, Icon, Link, Text } from "@chakra-ui/react";
import { FiCheckCircle } from "react-icons/fi";

const QUICK_LINKS = ["Products", "Pricing", "Docs", "About", "Blog"];

const LEGAL_LINKS = ["Privacy Policy", "Terms of Service", "Cookie Settings"];

export function Footer() {
  return (
    <Box bg="bg" borderTopWidth="1px" borderColor="border">
      {/* Main content */}
      <Container maxW="6xl">
        <Grid
          templateColumns={{ base: "1fr", md: "1fr auto" }}
          gap={{ base: 10, md: 20 }}
          py={{ base: 12, md: 16 }}
        >
          {/* Left — brand + description */}
          <Flex direction="column" gap={6} maxW="sm">
            <Flex align="center" gap={2.5}>
              <Box
                bg="fg"
                borderRadius="lg"
                w={8}
                h={8}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon as={FiCheckCircle} color="bg" boxSize={4} />
              </Box>
              <Text fontWeight="bold" fontSize="lg" letterSpacing="-0.02em">
                scrub_
              </Text>
            </Flex>

            <Text fontSize="sm" color="fg.muted" lineHeight={1.7}>
              Scrub is an email hygiene tool that removes invalid recipients,
              blocks fake users and bots, and helps you protect your sender
              reputation.
            </Text>

            <Text fontSize="sm" color="fg.muted">
              Powered by{" "}
              <Link
                href="https://n0.rocks"
                target="_blank"
                rel="noopener noreferrer"
                color="fg"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                n0.
              </Link>
            </Text>
          </Flex>

          {/* Right — quick links */}
          <Flex direction="column" gap={4}>
            <Text fontWeight="semibold" fontSize="sm" letterSpacing="0.01em">
              Quick Links
            </Text>
            <Flex direction="column" gap={3}>
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link}
                  href="#"
                  fontSize="sm"
                  color="fg.muted"
                  _hover={{ color: "fg", textDecoration: "none" }}
                  transition="color 0.15s"
                >
                  {link}
                </Link>
              ))}
            </Flex>
          </Flex>
        </Grid>
      </Container>

      {/* Bottom bar */}
      <Box borderTopWidth="1px" borderColor="border">
        <Container maxW="6xl">
          <Flex
            py={5}
            align="center"
            justify="space-between"
            direction={{ base: "column", sm: "row" }}
            gap={3}
          >
            <Text fontSize="xs" color="fg.muted">
              © {new Date().getFullYear()} The Scrub App — All rights reserved
            </Text>
            <Flex gap={5}>
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link}
                  href="#"
                  fontSize="xs"
                  color="fg.muted"
                  _hover={{ color: "fg", textDecoration: "none" }}
                  transition="color 0.15s"
                >
                  {link}
                </Link>
              ))}
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
