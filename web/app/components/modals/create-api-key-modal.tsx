import { useEffect, useRef, useState } from "react";
import { Box, Button, Dialog, Flex, Input, Text } from "@chakra-ui/react";
import { FiCheck, FiCopy } from "react-icons/fi";
import { type ApiKey, type CreatedApiKey, createApiKey } from "api/api-keys";

interface CreateApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (key: ApiKey) => void;
}

export function CreateApiKeyModal({
  open,
  onClose,
  onCreated,
}: CreateApiKeyModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !created) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, created]);

  function reset() {
    setName("");
    setLoading(false);
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  function handleClose() {
    if (created) {
      onCreated({
        id: created.id,
        name: created.name,
        created_at: created.created_at,
        last_used_at: null,
        active: true,
      });
    }
    reset();
    onClose();
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createApiKey(trimmed);
      setCreated(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(created.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          maxW="440px"
          w="full"
          mx={4}
        >
          {!created ? (
            <>
              <Dialog.Header px={6} pt={6} pb={0}>
                <Dialog.Title
                  fontSize="lg"
                  fontWeight="500"
                  letterSpacing="-0.02em"
                >
                  New API key
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body px={6} py={5}>
                <Text fontSize="sm" color="fg.muted" mb={5}>
                  Give this key a name so you can identify it later.
                </Text>
                <Box>
                  <Text fontSize="xs" fontWeight="medium" color="fg" mb={1.5}>
                    Key name
                  </Text>
                  <Input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="e.g. Zapier, Production app"
                    size="sm"
                    bg="bg.subtle"
                    border="1px solid"
                    borderColor="border"
                    borderRadius="md"
                    fontSize="sm"
                    _focus={{ borderColor: "brand.solid", outline: "none" }}
                  />
                  {error && (
                    <Text fontSize="xs" color="red.500" mt={2}>
                      {error}
                    </Text>
                  )}
                </Box>
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
                  disabled={!name.trim()}
                  onClick={handleSubmit}
                >
                  Create key
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
                  Key created
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
                  <Text
                    fontSize="xs"
                    color="green.700"
                    _dark={{ color: "green.300" }}
                    fontWeight="medium"
                    mb={1}
                  >
                    Copy this key now — it won't be shown again.
                  </Text>
                  <Flex align="center" gap={2} mt={2}>
                    <Text
                      fontFamily="mono"
                      fontSize="xs"
                      color="fg"
                      flex={1}
                      minW={0}
                      wordBreak="break-all"
                    >
                      {created.key}
                    </Text>
                    <Button
                      size="xs"
                      variant="outline"
                      borderColor="green.300"
                      borderRadius="md"
                      flexShrink={0}
                      onClick={handleCopy}
                    >
                      {copied ? <FiCheck /> : <FiCopy />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </Flex>
                </Box>
                <Text fontSize="sm" color="fg.muted">
                  Store it in a secrets manager or environment variable. You can
                  revoke this key at any time.
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
