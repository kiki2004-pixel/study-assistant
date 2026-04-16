import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react";
import { FiKey, FiPlus, FiTrash2 } from "react-icons/fi";
import { type ApiKey, listApiKeys, revokeApiKey } from "api/api-keys";
import { formatDate } from "@lib/utils";
import { CreateApiKeyModal } from "@app/components/modals/create-api-key-modal";

// ---------------------------------------------------------------------------
// Key row
// ---------------------------------------------------------------------------

interface KeyRowProps {
  apiKey: ApiKey;
  onRevoke: (id: number) => void;
  revoking: boolean;
}

function KeyRow({ apiKey, onRevoke, revoking }: KeyRowProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Flex
      align="center"
      justify="space-between"
      px={4}
      py={3}
      borderBottomWidth="1px"
      borderColor="border"
      gap={4}
      flexWrap="wrap"
      _last={{ borderBottomWidth: 0 }}
    >
      <Flex align="center" gap={3} flex={1} minW={0}>
        <Box color="fg.muted" flexShrink={0}>
          <FiKey size={14} />
        </Box>
        <Box minW={0}>
          <Flex align="center" gap={2} mb={0.5}>
            <Text fontSize="sm" fontWeight="500" truncate>
              {apiKey.name}
            </Text>
            {!apiKey.active && (
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="red"
                borderRadius="full"
                px={2}
                fontSize="10px"
              >
                Revoked
              </Badge>
            )}
          </Flex>
          <Flex gap={4}>
            <Text fontSize="xs" color="fg.muted">
              Created {formatDate(new Date(apiKey.created_at).getTime() / 1000)}
            </Text>
            {apiKey.last_used_at ? (
              <Text fontSize="xs" color="fg.muted">
                Last used{" "}
                {formatDate(new Date(apiKey.last_used_at).getTime() / 1000)}
              </Text>
            ) : (
              <Text fontSize="xs" color="fg.muted">
                Never used
              </Text>
            )}
          </Flex>
        </Box>
      </Flex>

      {apiKey.active && (
        <Flex align="center" gap={2} flexShrink={0}>
          {confirming ? (
            <>
              <Text fontSize="xs" color="fg.muted">
                Revoke this key?
              </Text>
              <Button
                size="xs"
                colorPalette="red"
                borderRadius="md"
                fontWeight="500"
                loading={revoking}
                onClick={() => onRevoke(apiKey.id)}
              >
                Confirm
              </Button>
              <Button
                size="xs"
                variant="outline"
                borderColor="border"
                borderRadius="md"
                fontWeight="500"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="xs"
              variant="ghost"
              color="fg.muted"
              borderRadius="md"
              _hover={{
                color: "red.500",
                bg: "red.50",
                _dark: { bg: "red.950" },
              }}
              onClick={() => setConfirming(true)}
            >
              <FiTrash2 />
              Revoke
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [revoking, setRevoking] = useState<number | null>(null);

  useEffect(() => {
    listApiKeys()
      .then(setKeys)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(key: ApiKey) {
    setKeys((prev) => [key, ...prev]);
  }

  async function handleRevoke(id: number) {
    setRevoking(id);
    try {
      await revokeApiKey(id);
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, active: false } : k)),
      );
    } catch {
      // leave state unchanged on error
    } finally {
      setRevoking(null);
    }
  }

  const activeKeys = keys.filter((k) => k.active);
  const revokedKeys = keys.filter((k) => !k.active);

  return (
    <Container maxW="3xl" py={10}>
      {/* Header */}
      <Flex align="flex-start" justify="space-between" mb={8} gap={4}>
        <Box>
          <Heading
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="400"
            fontFamily="mono"
            letterSpacing="-0.02em"
            mb={1}
          >
            API Keys
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Keys allow integrations to call the API without OAuth.
          </Text>
        </Box>
        <Button
          size="sm"
          bg="fg"
          color="bg"
          borderRadius="md"
          fontWeight="500"
          flexShrink={0}
          _hover={{ opacity: 0.85 }}
          onClick={() => setModalOpen(true)}
        >
          <FiPlus />
          New key
        </Button>
      </Flex>

      {/* Key list */}
      {loading ? (
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          px={4}
          py={8}
        >
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            Loading…
          </Text>
        </Box>
      ) : error ? (
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          px={4}
          py={8}
        >
          <Text fontSize="sm" color="red.500" textAlign="center">
            {error}
          </Text>
        </Box>
      ) : activeKeys.length === 0 && revokedKeys.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          gap={3}
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          borderStyle="dashed"
          py={12}
        >
          <Box color="fg.muted">
            <FiKey size={24} />
          </Box>
          <Box textAlign="center">
            <Text fontSize="sm" fontWeight="500" mb={0.5}>
              No API keys yet
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Create a key to start calling the API from your integrations.
            </Text>
          </Box>
          <Button
            size="sm"
            variant="outline"
            borderColor="border"
            borderRadius="md"
            fontWeight="500"
            mt={1}
            onClick={() => setModalOpen(true)}
          >
            <FiPlus />
            Create your first key
          </Button>
        </Flex>
      ) : (
        <Box>
          {activeKeys.length > 0 && (
            <Box
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              overflow="hidden"
              mb={6}
            >
              {activeKeys.map((k) => (
                <KeyRow
                  key={k.id}
                  apiKey={k}
                  onRevoke={handleRevoke}
                  revoking={revoking === k.id}
                />
              ))}
            </Box>
          )}

          {revokedKeys.length > 0 && (
            <Box>
              <Text
                fontSize="xs"
                fontWeight="500"
                color="fg.muted"
                mb={3}
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                Revoked
              </Text>
              <Box
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                overflow="hidden"
                opacity={0.6}
              >
                {revokedKeys.map((k) => (
                  <KeyRow
                    key={k.id}
                    apiKey={k}
                    onRevoke={handleRevoke}
                    revoking={revoking === k.id}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      <CreateApiKeyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </Container>
  );
}
