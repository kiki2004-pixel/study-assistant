import { useAuth } from "react-oidc-context";
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Text,
  Badge,
} from "@chakra-ui/react";
import { FiMoreHorizontal } from "react-icons/fi";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      py={4}
      borderBottomWidth="1px"
      borderColor="border"
      gap={8}
    >
      <Text fontSize="sm">{label}</Text>
      <Box>{children}</Box>
    </Flex>
  );
}

function formatDate(epoch: number | undefined): string {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDevice(): string {
  const ua = navigator.userAgent;
  let browser = "Browser";
  let os = "Unknown";

  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";

  if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";

  return `${browser} (${os})`;
}

export default function AccountSettings() {
  const auth = useAuth();
  const profile = auth.user?.profile;

  const issuedAt = profile?.iat as number | undefined;
  const expiresAt = auth.user?.expires_at;

  function handleLogout() {
    auth.signoutRedirect();
  }

  return (
    <Box>
      <Heading
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="400"
        letterSpacing="-0.02em"
        mb={8}
      >
        Account
      </Heading>

      {/* Account actions */}
      <Box mb={10}>
        <Row label="Log out of all devices">
          <Button
            size="sm"
            variant="outline"
            borderColor="border"
            borderRadius="md"
            fontSize="sm"
            fontWeight="500"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </Row>

        <Row label="Delete account">
          <Text fontSize="xs" color="fg.muted" textAlign="right" maxW="220px">
            Contact support to permanently delete your account and all data.
          </Text>
        </Row>

        <Row label="Your role">
          <Text fontSize="sm" color="fg.muted">
            User
          </Text>
        </Row>
      </Box>

      {/* Active sessions */}
      <Box>
        <Heading fontSize="md" fontWeight="600" letterSpacing="-0.01em" mb={5}>
          Active sessions
        </Heading>

        <Table.Root size="sm" variant="outline" borderRadius="md">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader
                fontSize="xs"
                fontWeight="500"
                color="fg.muted"
                py={3}
              >
                Device
              </Table.ColumnHeader>
              <Table.ColumnHeader
                fontSize="xs"
                fontWeight="500"
                color="fg.muted"
                py={3}
              >
                Created
              </Table.ColumnHeader>
              <Table.ColumnHeader
                fontSize="xs"
                fontWeight="500"
                color="fg.muted"
                py={3}
              >
                Expires
              </Table.ColumnHeader>
              <Table.ColumnHeader py={3} />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell py={4} fontSize="sm">
                <Flex align="center" gap={2}>
                  {getDevice()}
                  <Badge
                    size="sm"
                    variant="subtle"
                    colorPalette="green"
                    borderRadius="full"
                    px={2}
                    fontSize="10px"
                  >
                    Current
                  </Badge>
                </Flex>
              </Table.Cell>
              <Table.Cell py={4} fontSize="sm" color="fg.muted">
                {formatDate(issuedAt)}
              </Table.Cell>
              <Table.Cell py={4} fontSize="sm" color="fg.muted">
                {formatDate(expiresAt)}
              </Table.Cell>
              <Table.Cell py={4} textAlign="right">
                <Box
                  as="button"
                  color="fg.muted"
                  _hover={{ color: "fg" }}
                  transition="color 0.1s"
                >
                  <FiMoreHorizontal />
                </Box>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
