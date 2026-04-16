import { useEffect, useRef, useState } from "react";
import { Box, Button, Dialog, Flex, Input, Text } from "@chakra-ui/react";
import { FiCheck } from "react-icons/fi";
import {
  createListmonkIntegration,
  deleteListmonkIntegration,
  testListmonkIntegration,
} from "api/integrations";
import type { Integration } from "@types/integrations";

interface ConnectListmonkModalProps {
  open: boolean;
  onClose: () => void;
  onConnected: (integration: Integration) => void;
}

export function ConnectListmonkModal({
  open,
  onClose,
  onConnected,
}: ConnectListmonkModalProps) {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<{
    integration: Integration;
    subscriberCount: number | null;
  } | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !connected) {
      setTimeout(() => urlRef.current?.focus(), 50);
    }
  }, [open, connected]);

  function reset() {
    setUrl("");
    setUsername("");
    setApiToken("");
    setLoading(false);
    setError(null);
    setConnected(null);
  }

  function handleClose() {
    if (connected) {
      onConnected(connected.integration);
    }
    reset();
    onClose();
  }

  async function handleConnect() {
    const trimmedUrl = url.trim();
    const trimmedUsername = username.trim();
    const trimmedToken = apiToken.trim();
    if (!trimmedUrl || !trimmedUsername || !trimmedToken) return;

    setLoading(true);
    setError(null);

    try {
      const integration = await createListmonkIntegration(
        trimmedUrl,
        trimmedUsername,
        trimmedToken,
      );
      const test = await testListmonkIntegration(integration.id);
      if (!test.success) {
        try {
          await deleteListmonkIntegration(integration.id);
        } catch {}
        setError(
          test.message || "Connection test failed. Check your credentials.",
        );
        return;
      }
      setConnected({ integration, subscriberCount: test.subscriber_count });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg"
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          shadow="lg"
          maxW="480px"
          w="full"
          mx={4}
        >
          {!connected ? (
            <>
              <Dialog.Header px={6} pt={6} pb={0}>
                <Dialog.Title
                  fontSize="lg"
                  fontWeight="500"
                  letterSpacing="-0.02em"
                >
                  Connect Listmonk
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body px={6} py={5}>
                <Text fontSize="sm" color="fg.muted" mb={5}>
                  Enter your Listmonk URL and API credentials. We'll test the
                  connection before saving.
                </Text>
                <Flex direction="column" gap={4}>
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" color="fg" mb={1.5}>
                      Listmonk URL
                    </Text>
                    <Input
                      ref={urlRef}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://listmonk.example.com"
                      size="sm"
                      bg="bg.subtle"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="md"
                      fontSize="sm"
                      fontFamily="mono"
                      _focus={{ borderColor: "brand.solid", outline: "none" }}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" color="fg" mb={1.5}>
                      Username
                    </Text>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="api_user"
                      size="sm"
                      bg="bg.subtle"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="md"
                      fontSize="sm"
                      fontFamily="mono"
                      _focus={{ borderColor: "brand.solid", outline: "none" }}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" color="fg" mb={1.5}>
                      API token
                    </Text>
                    <Input
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                      type="password"
                      placeholder="••••••••••••••••"
                      size="sm"
                      bg="bg.subtle"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="md"
                      fontSize="sm"
                      fontFamily="mono"
                      _focus={{ borderColor: "brand.solid", outline: "none" }}
                    />
                  </Box>
                  {error && (
                    <Text fontSize="xs" color="red.500">
                      {error}
                    </Text>
                  )}
                </Flex>
              </Dialog.Body>
              <Dialog.Footer px={6} pb={6} gap={2}>
                <Dialog.ActionTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    borderRadius="md"
                    fontWeight="500"
                    onClick={reset}
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  size="sm"
                  bg="fg"
                  color="bg"
                  borderRadius="md"
                  fontWeight="500"
                  _hover={{ opacity: 0.85 }}
                  loading={loading}
                  disabled={!url.trim() || !username.trim() || !apiToken.trim()}
                  onClick={handleConnect}
                >
                  Test & Connect
                </Button>
              </Dialog.Footer>
            </>
          ) : (
            <>
              <Dialog.Header px={6} pt={6} pb={0}>
                <Dialog.Title
                  fontSize="lg"
                  fontWeight="500"
                  letterSpacing="-0.02em"
                >
                  Connected
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body px={6} py={5}>
                <Box
                  bg="green.50"
                  _dark={{ bg: "green.950" }}
                  border="1px solid"
                  borderColor="green.200"
                  borderRadius="md"
                  px={4}
                  py={3}
                  mb={4}
                >
                  <Flex align="center" gap={2} mb={1}>
                    <Box color="green.600" _dark={{ color: "green.400" }}>
                      <FiCheck size={14} />
                    </Box>
                    <Text
                      fontSize="xs"
                      color="green.700"
                      _dark={{ color: "green.300" }}
                      fontWeight="medium"
                    >
                      Listmonk connected successfully
                    </Text>
                  </Flex>
                  {connected.subscriberCount !== null && (
                    <Text
                      fontSize="xs"
                      color="green.600"
                      _dark={{ color: "green.400" }}
                    >
                      {connected.subscriberCount.toLocaleString()} subscribers
                      found
                    </Text>
                  )}
                </Box>
                <Text fontSize="sm" color="fg.muted">
                  Your Listmonk instance is now connected. You can validate
                  lists from the integration page.
                </Text>
              </Dialog.Body>
              <Dialog.Footer px={6} pb={6}>
                <Button
                  size="sm"
                  bg="fg"
                  color="bg"
                  borderRadius="md"
                  fontWeight="500"
                  _hover={{ opacity: 0.85 }}
                  onClick={handleClose}
                >
                  Done
                </Button>
              </Dialog.Footer>
            </>
          )}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
