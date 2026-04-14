import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react";
import { AuthenticatedNavbar } from "@app/components/navbar/authenticated-navbar";

const NAV_ITEMS = [
  { label: "General", href: "/settings/general" },
  { label: "Account", href: "/settings/account" },
  { label: "Analytics", href: "/settings/analytics" },
  { label: "History", href: "/settings/history" },
];

export default function Settings() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  if (auth.isLoading || !auth.isAuthenticated) return null;

  return (
    <Box minH="100vh" bg="bg">
      <AuthenticatedNavbar />

      <Container maxW="6xl" py={10}>
        <Flex gap={12} align="flex-start">
          {/* Sidebar */}
          <Box flexShrink={0} w="180px">
            <Heading
              fontSize="lg"
              fontWeight="600"
              letterSpacing="-0.01em"
              mb={5}
            >
              Settings
            </Heading>
            <Flex direction="column" gap={1}>
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} to={item.href} end>
                  {({ isActive }) => (
                    <Text
                      px={3}
                      py={2}
                      fontSize="sm"
                      fontWeight={isActive ? "500" : "400"}
                      color={isActive ? "fg" : "fg.muted"}
                      bg={isActive ? "bg.muted" : "transparent"}
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ color: "fg", bg: "bg.muted" }}
                      transition="all 0.1s"
                    >
                      {item.label}
                    </Text>
                  )}
                </NavLink>
              ))}
            </Flex>
          </Box>

          {/* Content */}
          <Box flex={1} minW={0}>
            <Outlet />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
