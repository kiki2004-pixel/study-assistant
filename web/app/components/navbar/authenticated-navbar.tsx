import { useAuth } from "react-oidc-context";
import { Box, Container, Flex, Icon, Text } from "@chakra-ui/react";
import { FiCheckCircle } from "react-icons/fi";
import { useNavigate } from "react-router";
import UserDropdown from "../dropdowns/user-dropdown";

const NAV_LINKS = [
  { label: "Lists", href: "/lists" },
  { label: "Integrations", href: "/integrations" },
  { label: "Docs", href: "/docs" },
  { label: "API", href: "/api" },
];

export function AuthenticatedNavbar() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <Box position="sticky" top={0} zIndex={100} bg="bg">
      <Box py={4}>
        <Container maxW="7xl">
          <Flex align="center" justify="space-between">
            {/* Logo */}
            <Flex align="center" gap={3}>
              <Box
                bg="#1a1a1a"
                borderRadius="lg"
                w="36px"
                h="36px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon as={FiCheckCircle} color="white" boxSize={4} />
              </Box>
              <Text fontWeight="bold" fontSize="lg" letterSpacing="-0.02em">
                scrub_
              </Text>
            </Flex>

            {/* Nav links */}
            <Flex align="center" gap={7} display={{ base: "none", md: "flex" }}>
              {NAV_LINKS.map((link) => (
                <Text
                  key={link.label}
                  fontSize="sm"
                  fontWeight="medium"
                  color="fg.muted"
                  cursor="pointer"
                  _hover={{ color: "fg" }}
                  transition="color 0.15s"
                  onClick={() => navigate(link.href)}
                >
                  {link.label}
                </Text>
              ))}
            </Flex>

            {/* Right side */}
            <Flex align="center" gap={3}>
              <Text
                fontSize="sm"
                color="fg.muted"
                display={{ base: "none", md: "block" }}
              >
                {auth.user?.profile.email}
              </Text>
              <UserDropdown />
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
