import { useEffect, useState } from "react";
import { Box, Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import { getBulkHistory } from "api/history";
import type { HistoryEntry } from "types/history";
import { StatusBadge } from "@app/components/badges/status-badge";

export function BulkDrawerCard({
  requestId,
  token,
  onClose,
}: {
  requestId: string;
  token: string;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBulkHistory(token, requestId)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [requestId, token]);

  const valid = entries.filter((e) => e.is_valid).length;
  const invalid = entries.length - valid;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={200}
      bg="blackAlpha.600"
      onClick={onClose}
    >
      <Box
        position="absolute"
        right={0}
        top={0}
        bottom={0}
        w={{ base: "100%", md: "520px" }}
        bg="bg.subtle"
        boxShadow="xl"
        overflowY="auto"
        onClick={(e) => e.stopPropagation()}
        <Box
          px={6}
          py={5}
          borderBottomWidth="1px"
          borderColor="border"
          position="sticky"
          top={0}
          bg="bg.subtle"
          zIndex={1}
        >
          <Flex justify="space-between" align="flex-start">
            <Box>
              <Text
                fontSize="xs"
                color="fg.muted"
                mb={1}
                letterSpacing="0.06em"
                textTransform="uppercase"
                fontWeight={500}
              >
                Bulk Job
              </Text>
              <Text
                fontFamily="Geist Mono, monospace"
                fontSize="xs"
                color="fg"
                wordBreak="break-all"
              >
                {requestId}
              </Text>
            </Box>
            <Button size="sm" variant="ghost" onClick={onClose} mt={-1}>
            </Button>
          </Flex>

          {!loading && entries.length > 0 && (
            <Flex gap={3} mt={4}>
              <Box
                bg="valid.bg"
                border="1px solid"
                borderColor="valid.border"
                borderRadius="md"
                px={3}
                py={2}
                flex={1}
              >
                <Text fontSize="xs" color="valid.fg" fontWeight={500}>
                  Valid
                </Text>
                <Text
                  fontSize="xl"
                  fontWeight={700}
                  color="valid.fg"
                  fontFamily="Geist Mono, monospace"
                >
                  {valid}
                </Text>
              </Box>
              <Box
                bg="invalid.bg"
                border="1px solid"
                borderColor="invalid.border"
                borderRadius="md"
                px={3}
                py={2}
                flex={1}
              >
                <Text fontSize="xs" color="invalid.fg" fontWeight={500}>
                  Invalid
                </Text>
                <Text
                  fontSize="xl"
                  fontWeight={700}
                  color="invalid.fg"
                  fontFamily="Geist Mono, monospace"
                >
                  {invalid}
                </Text>
              </Box>
              <Box
                bg="bg.muted"
                border="1px solid"
                borderColor="border"
                borderRadius="md"
                px={3}
                py={2}
                flex={1}
              >
                <Text fontSize="xs" color="fg.muted" fontWeight={500}>
                  Total
                </Text>
                <Text
                  fontSize="xl"
                  fontWeight={700}
                  color="fg"
                  fontFamily="Geist Mono, monospace"
                >
                  {entries.length}
                </Text>
              </Box>
            </Flex>
          )}
        </Box>

        {/* Entry list */}
        <Box px={6} py={4}>
          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner color="brand.solid" />
            </Flex>
          ) : entries.length === 0 ? (
            <Text color="fg.muted" fontSize="sm">
              No results found.
            </Text>
          ) : (
            <Flex direction="column" gap={1}>
              {entries.map((e) => (
                <Flex
                  key={e.id}
                  align="center"
                  justify="space-between"
                  gap={3}
                  py={2}
                  borderBottomWidth="1px"
                  borderColor="border"
                  _last={{ borderBottomWidth: 0 }}
                >
                  <Flex align="center" gap={2.5} flex={1} minW={0}>
                    <Box
                      w={1.5}
                      h={1.5}
                      borderRadius="full"
                      bg={e.is_valid ? "valid.fg" : "invalid.fg"}
                      flexShrink={0}
                    />
                    <Text
                      fontSize="xs"
                      fontFamily="Geist Mono, monospace"
                      color="fg"
                      truncate
                    >
                      {e.email}
                    </Text>
                  </Flex>
                  <Flex align="center" gap={3} flexShrink={0}>
                    <StatusBadge isValid={e.is_valid} />
                    {e.quality_score != null && (
                      <Text
                        fontSize="xs"
                        fontFamily="Geist Mono, monospace"
                        color="fg.muted"
                        w="32px"
                        textAlign="right"
                      >
                        {e.quality_score}
                      </Text>
                    )}
                  </Flex>
                </Flex>
              ))}
            </Flex>
          )}
        </Box>
      </Box>
    </Box>
  );
}
