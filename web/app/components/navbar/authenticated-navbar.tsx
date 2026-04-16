import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import {
  Avatar,
  Box,
  Container,
  Flex,
  Icon,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { FiCheckCircle, FiMenu, FiX } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router";
import { getMe } from "api/context";
import type { UserContext } from "types/context";
import UsageStats from "../popovers/usage-stats";
import ApiDropdown from "../dropdowns/api-dropdown";

const NAV_LINKS = [
  { label: "Single", href: "/dashboard" },
  { label: "Lists", href: "/lists" },
  { label: "Integrations", href: "/integrations" },
  { label: "API", href: "/api/keys", dropdown: true },
];

export function AuthenticatedNavbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [context, setContext] = useState<UserContext | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user?.access_token) return;
    getMe().then(setContext).catch(console.error);
  }, [auth.isAuthenticated, auth.user?.access_token]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleNav(href: string) {
    navigate(href);
    setMobileOpen(false);
  }

  return (
    <Box position="sticky" top={0} zIndex={100} bg="bg">
      <Box
        py={4}
        borderBottomWidth={mobileOpen ? "1px" : "0"}
        borderColor="border"
      >
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

            {/* Nav links — desktop */}
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
                display={{ base: "none", md: "flex" }}
                onClick={() => navigate("/settings/general")}
              >
                <Avatar.Fallback />
                <Avatar.Image src="https://bit.ly/broken-link" />
              </Avatar.Root>

              {/* Hamburger — mobile only */}
              <IconButton
                display={{ base: "flex", md: "none" }}
                aria-label="Toggle menu"
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen((o) => !o)}
              >
                <Icon as={mobileOpen ? FiX : FiMenu} boxSize={5} />
              </IconButton>
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Mobile menu */}
      {mobileOpen && (
        <Box
          display={{ base: "block", md: "none" }}
          borderBottomWidth="1px"
          borderColor="border"
          bg="bg"
        >
          <Container maxW="7xl" py={3}>
            <Flex direction="column" gap={1}>
              {NAV_LINKS.map((link) => (
                <Text
                  key={link.label}
                  px={3}
                  py={2.5}
                  fontSize="sm"
                  fontWeight="medium"
                  borderRadius="md"
                  color={
                    location.pathname.startsWith(link.href) ? "fg" : "fg.muted"
                  }
                  bg={
                    location.pathname.startsWith(link.href)
                      ? "bg.muted"
                      : "transparent"
                  }
                  cursor="pointer"
                  _hover={{ color: "fg", bg: "bg.muted" }}
                  transition="all 0.1s"
                  onClick={() => handleNav(link.href)}
                >
                  {link.label}
                </Text>
              ))}

              {/* Divider + account */}
              <Box borderTopWidth="1px" borderColor="border" mt={1} pt={2}>
                <Flex
                  align="center"
                  gap={3}
                  px={3}
                  py={2.5}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: "bg.muted" }}
                  onClick={() => handleNav("/settings/general")}
                >
                  <Avatar.Root colorPalette="red" size="xs">
                    <Avatar.Fallback />
                    <Avatar.Image src="https://bit.ly/broken-link" />
                  </Avatar.Root>
                  <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                    Settings
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Container>
        </Box>
      )}
    </Box>
  );
}
