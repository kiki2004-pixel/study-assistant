import { useAuth } from "react-oidc-context";
import { Box, Button, Flex, Heading, Text, Badge } from "@chakra-ui/react";
import { FiMoreHorizontal } from "react-icons/fi";
import { formatDate, getDevice } from "@lib/utils";
import { SettingsRow } from "@app/components/settings/settings-row";

export default function AccountSettings() {
  const auth = useAuth();
  const profile = auth.user?.profile;

  const issuedAt = profile?.iat as number | undefined;
  const expiresAt = auth.user?.expires_at;

  function handleLogout() {
    auth.signoutRedirect();
  }

  const handleUpdateProfile = () => {
    window.open(
      `${auth.settings.authority}/ui/console/users/me`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const handleDeleteAccount = () => {};

  return (
    <Box>
      <Heading
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="400"
        letterSpacing="-0.02em"
        fontFamily="mono"
        mb={8}
      >
        Account
      </Heading>

      {/* Account actions */}
      <Box mb={10}>
        <SettingsRow label="Update profile">
          <Button
            size="sm"
            variant="outline"
            borderColor="border"
            borderRadius="md"
            fontSize="sm"
            fontWeight="500"
            onClick={handleUpdateProfile}
          >
            Update profile
          </Button>
        </SettingsRow>

        <SettingsRow label="Log out of all devices">
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
        </SettingsRow>

        <SettingsRow label="Delete account">
          <Text fontSize="xs" color="fg.muted" textAlign="right" maxW="220px">
            Contact support to permanently delete your account and all data.
          </Text>
        </SettingsRow>
      </Box>

      {/* Active sessions */}
      <Box>
        <Heading
          fontSize="md"
          fontWeight="500"
          fontFamily="mono"
          letterSpacing="-0.01em"
          mb={5}
        >
          Active sessions
        </Heading>

        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
        >
          <Flex
            align="center"
            justify="space-between"
            px={4}
            py={3}
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Flex align="center" gap={2} fontSize="sm">
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
            <Box
              as="button"
              color="fg.muted"
              _hover={{ color: "fg" }}
              transition="color 0.1s"
            >
              <FiMoreHorizontal />
            </Box>
          </Flex>
          <Flex gap={6} px={4} py={3} bg="bg.subtle">
            <Box>
              <Text fontSize="xs" color="fg.muted" mb={0.5}>
                Created
              </Text>
              <Text fontSize="sm">{formatDate(issuedAt)}</Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="fg.muted" mb={0.5}>
                Expires
              </Text>
              <Text fontSize="sm">{formatDate(expiresAt)}</Text>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
