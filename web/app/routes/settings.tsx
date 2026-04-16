import { NavLink, Outlet } from "react-router";
import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react";

const NAV_ITEMS = [
  { label: "General", href: "/settings/general" },
  { label: "Account", href: "/settings/account" },
  { label: "Analytics", href: "/settings/analytics" },
  { label: "History", href: "/settings/history" },
];

export default function Settings() {
  return (
    <Container maxW="6xl" py={{ base: 6, md: 10 }}>
      <Flex
        gap={12}
        align="flex-start"
        direction={{ base: "column", md: "row" }}
      >
        {/* Sidebar / top nav */}
        <Box flexShrink={0} w={{ base: "full", md: "180px" }}>
          <Heading
            fontSize="lg"
            fontWeight="500"
            fontFamily="mono"
            letterSpacing="-0.01em"
            mb={5}
            display={{ base: "none", md: "block" }}
          >
            Settings
          </Heading>
          <Flex
            direction={{ base: "row", md: "column" }}
            gap={1}
            overflowX={{ base: "auto", md: "visible" }}
            borderBottomWidth={{ base: "1px", md: "0" }}
            borderColor="border"
            pb={{ base: 1, md: 0 }}
          >
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} to={item.href} end>
                {({ isActive }) => (
                  <Text
                    px={3}
                    py={2}
                    fontSize="sm"
                    fontWeight={isActive ? "500" : "400"}
                    color={isActive ? "fg" : "fg.muted"}
                    bg={{
                      base: "transparent",
                      md: isActive ? "bg.muted" : "transparent",
                    }}
                    borderRadius={{ base: "none", md: "md" }}
                    borderBottomWidth={{ base: "2px", md: "0" }}
                    borderColor={{
                      base: isActive ? "fg" : "transparent",
                      md: "transparent",
                    }}
                    cursor="pointer"
                    whiteSpace="nowrap"
                    _hover={{
                      color: "fg",
                      bg: { base: "transparent", md: "bg.muted" },
                    }}
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
  );
}
