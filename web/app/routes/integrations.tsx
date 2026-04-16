import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
} from "@chakra-ui/react";
import { FiCheck, FiList } from "react-icons/fi";
import {
  deleteListmonkIntegration,
  getListmonkIntegration,
  getListmonkLists,
} from "api/integrations";
import { ConnectListmonkModal } from "@app/components/modals/connect-listmonk-modal";
import { ListmonkListCard } from "@app/components/lists/listmonk-list-card";
import type { Integration } from "@types/integrations";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Integrations() {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [lists, setLists] = useState<ListmonkList[]>([]);
  const [loadingIntegration, setLoadingIntegration] = useState(true);
  const [loadingLists, setLoadingLists] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    getListmonkIntegration()
      .then(setIntegration)
      .catch(() => setIntegration(null))
      .finally(() => setLoadingIntegration(false));
  }, []);

  useEffect(() => {
    if (!integration) {
      setLists([]);
      return;
    }
    setLoadingLists(true);
    setListsError(null);
    getListmonkLists()
      .then(setLists)
      .catch((e) => setListsError(e.message))
      .finally(() => setLoadingLists(false));
  }, [integration]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await deleteListmonkIntegration();
      setIntegration(null);
      setLists([]);
      setConfirmDisconnect(false);
    } catch {
      // leave state unchanged
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Container maxW="7xl" py={10}>
      {/* Header */}
      <Box mb={10}>
        <Heading
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="400"
          letterSpacing="-0.02em"
          mb={1}
        >
          Integrations
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Connect Scrub to your email tools and platforms.
        </Text>
      </Box>

      {/* Listmonk integration card */}
      <Box maxW="2xl">
        <Text
          fontSize="xs"
          fontWeight="500"
          color="fg.muted"
          mb={3}
          textTransform="uppercase"
          letterSpacing="0.06em"
        >
          Available
        </Text>

        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          bg="bg.subtle"
          overflow="hidden"
        >
          <Flex align="flex-start" p={5} gap={4}>
            {/* Icon */}
            <Flex
              w={9}
              h={9}
              align="center"
              justify="center"
              borderRadius="md"
              bg="bg.muted"
              borderWidth="1px"
              borderColor="border"
              flexShrink={0}
            >
              <FiList size={16} />
            </Flex>

            {/* Info */}
            <Box flex={1} minW={0}>
              <Flex align="center" gap={2} mb={0.5}>
                <Text fontSize="sm" fontWeight="500">
                  Listmonk
                </Text>
                {integration && (
                  <Badge
                    size="sm"
                    colorPalette="green"
                    variant="subtle"
                    borderRadius="full"
                    px={2}
                    fontSize="10px"
                    gap={1}
                  >
                    <FiCheck size={9} />
                    Connected
                  </Badge>
                )}
              </Flex>
              <Text fontSize="xs" color="fg.muted" mb={3}>
                Self-hosted newsletter & mailing list manager. Pull your lists
                into Scrub to validate subscribers and improve deliverability.
              </Text>

              {loadingIntegration ? (
                <Text fontSize="xs" color="fg.muted">
                  Loading…
                </Text>
              ) : integration ? (
                <Box>
                  <Text
                    fontSize="xs"
                    fontFamily="mono"
                    color="fg.muted"
                    mb={3}
                    truncate
                  >
                    {integration.url}
                  </Text>
                  <Flex align="center" gap={2}>
                    {confirmDisconnect ? (
                      <>
                        <Text fontSize="xs" color="fg.muted">
                          Disconnect Listmonk?
                        </Text>
                        <Button
                          size="xs"
                          colorPalette="red"
                          borderRadius="md"
                          fontWeight="500"
                          loading={disconnecting}
                          onClick={handleDisconnect}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor="border"
                          borderRadius="md"
                          fontWeight="500"
                          onClick={() => setConfirmDisconnect(false)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="border"
                        borderRadius="md"
                        fontWeight="500"
                        color="fg.muted"
                        _hover={{
                          color: "red.500",
                          borderColor: "red.300",
                          bg: "red.50",
                          _dark: { bg: "red.950" },
                        }}
                        onClick={() => setConfirmDisconnect(true)}
                      >
                        Disconnect
                      </Button>
                    )}
                  </Flex>
                </Box>
              ) : (
                <Button
                  size="sm"
                  bg="fg"
                  color="bg"
                  borderRadius="md"
                  fontWeight="500"
                  _hover={{ opacity: 0.85 }}
                  onClick={() => setModalOpen(true)}
                >
                  Connect
                </Button>
              )}
            </Box>
          </Flex>
        </Box>

        {/* Lists section — shown when connected */}
        {integration && (
          <Box mt={8}>
            <Text
              fontSize="xs"
              fontWeight="500"
              color="fg.muted"
              mb={3}
              textTransform="uppercase"
              letterSpacing="0.06em"
            >
              Lists
            </Text>

            {loadingLists ? (
              <Box
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                px={4}
                py={6}
              >
                <Text fontSize="sm" color="fg.muted" textAlign="center">
                  Loading lists…
                </Text>
              </Box>
            ) : listsError ? (
              <Box
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                px={4}
                py={6}
              >
                <Text fontSize="sm" color="red.500" textAlign="center">
                  {listsError}
                </Text>
              </Box>
            ) : lists.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                gap={2}
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                borderStyle="dashed"
                py={10}
              >
                <Box color="fg.muted">
                  <FiList size={20} />
                </Box>
                <Text fontSize="sm" color="fg.muted">
                  No lists found in your Listmonk instance.
                </Text>
              </Flex>
            ) : (
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                }}
                gap={3}
              >
                {lists.map((list) => (
                  <ListmonkListCard key={list.id} list={list} />
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>

      <ConnectListmonkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnected={(i) => {
          setIntegration(i);
          setModalOpen(false);
        }}
      />
    </Container>
  );
}
