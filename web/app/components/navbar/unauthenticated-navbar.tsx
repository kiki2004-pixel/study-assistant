import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { Box, Button, Container, Flex, Icon, Text } from "@chakra-ui/react";
import { FiCheckCircle, FiChevronDown, FiMenu, FiX } from "react-icons/fi";
import { MdAdsClick } from "react-icons/md";
import { CiUser } from "react-icons/ci";
import { FaUser } from "react-icons/fa";

const NAV_LINKS = [
  { label: "Products", hasDropdown: true },
  { label: "Pricing", hasDropdown: false, href: "#pricing" },
  { label: "Docs", hasDropdown: true },
  { label: "About", hasDropdown: false },
];

export function UnauthenticatedNavbar() {
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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

            {/* Desktop nav links */}
            <Flex align="center" gap={7} display={{ base: "none", md: "flex" }}>
              {NAV_LINKS.map((link) => (
                <Flex
                  key={link.label}
                  align="center"
                  gap={1}
                  cursor="pointer"
                  color="fg.muted"
                  _hover={{ color: "fg" }}
                  transition="color 0.15s"
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {link.label}
                  </Text>
                  {link.hasDropdown && (
                    <Icon as={FiChevronDown} boxSize={3.5} />
                  )}
                </Flex>
              ))}
            </Flex>

            {/* Desktop CTA */}
            <Button
              size="sm"
              variant="outline"
              color="fg"
              border="1px solid"
              borderColor="fg"
              borderRadius="lg"
              px={5}
              h="44px"
              fontWeight="medium"
              _hover={{ bg: "bg.muted" }}
              display={{ base: "none", md: "flex" }}
              loading={auth.isLoading}
              onClick={() => auth.signinRedirect()}
            >
              <FaUser /> Sign In
            </Button>

            {/* Mobile hamburger */}
            <Box display={{ base: "flex", md: "none" }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                <Icon as={menuOpen ? FiX : FiMenu} boxSize={5} />
              </Button>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Mobile drawer */}
      {menuOpen && (
        <Box
          display={{ base: "block", md: "none" }}
          borderTopWidth="1px"
          borderColor="border"
          bg="bg.subtle"
        >
          <Container maxW="7xl" py={4}>
            <Flex direction="column" gap={1}>
              {NAV_LINKS.map((link) => (
                <Flex
                  key={link.label}
                  align="center"
                  justify="space-between"
                  px={3}
                  py={3}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: "bg.muted" }}
                  transition="background 0.15s"
                  onClick={() => setMenuOpen(false)}
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {link.label}
                  </Text>
                  {link.hasDropdown && (
                    <Icon as={FiChevronDown} boxSize={4} color="fg.muted" />
                  )}
                </Flex>
              ))}

              <Box pt={3} borderTopWidth="1px" borderColor="border" mt={2}>
                <Button
                  w="full"
                  variant="outline"
                  borderColor="border"
                  color="fg"
                  borderRadius="lg"
                  fontWeight="medium"
                  _hover={{ bg: "bg.muted" }}
                  loading={auth.isLoading}
                  onClick={() => {
                    setMenuOpen(false);
                    auth.signinRedirect();
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Flex>
          </Container>
        </Box>
      )}
    </Box>
  );
}
