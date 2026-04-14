import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Avatar, Box, Container, Flex, Icon, Text } from "@chakra-ui/react";
import { FiCheckCircle } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router";
import { getMe } from "api/context";
import type { UserContext } from "types/context";
import UsageStats from "../popovers/usage-stats";
import ApiDropdown from "../dropdowns/api-dropdown";

const NAV_LINKS = [
  { label: "Single", href: "/dashboard" },
  { label: "History", href: "/lists" },
  { label: "Integrations", href: "/integrations" },
  { label: "API", href: "/api", dropdown: true },
];

export function AuthenticatedNavbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [context, setContext] = useState<UserContext | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user?.access_token) return;
    getMe(auth.user.access_token).then(setContext).catch(console.error);
  }, [auth.isAuthenticated, auth.user?.access_token]);

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
              {NAV_LINKS.map((link) =>
                link.dropdown ? (
                  <ApiDropdown key={link.label} />
                ) : (
                  <Text
                    key={link.label}
                    fontSize="sm"
                    fontWeight="medium"
                    color={location.pathname === link.href ? "fg" : "fg.muted"}
                    bg={
                      location.pathname === link.href ? "brand.200" : undefined
                    }
                    cursor="pointer"
                    _hover={{ color: "fg" }}
                    transition="color 0.15s"
                    onClick={() => navigate(link.href)}
                  >
                    {link.label}
                  </Text>
                ),
              )}
            </Flex>

            {/* Right side */}
            <Flex align="center" gap={3}>
              {context?.stats && (
                <Flex
                  align="center"
                  gap={2}
                  display={{ base: "none", md: "flex" }}
                >
                  <UsageStats {...context.stats} />
                </Flex>
              )}
              <Avatar.Root
                colorPalette="red"
                onClick={() => navigate("/settings/general")}
              >
                <Avatar.Fallback />
                <Avatar.Image src="https://bit.ly/broken-link" />
              </Avatar.Root>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
