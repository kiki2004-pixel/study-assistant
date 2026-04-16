import { useEffect, useState } from "react";
import { Box, Button, Container, Flex, Heading, Text } from "@chakra-ui/react";
import { FiArrowLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { Link } from "react-router";
import { listListmonkIntegrations } from "api/integrations";
import { ConnectListmonkModal } from "@app/components/modals/connect-listmonk-modal";
import type { Integration } from "@types/integrations";

export default function IntegrationsListmonk() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    setLoading(true);
    listListmonkIntegrations()
      .then(setIntegrations)
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Container maxW="7xl" py={10}>
      {/* Back */}
      <Box mb={8}>
        <Button
          asChild
          size="sm"
          variant="ghost"
          color="fg.muted"
          borderRadius="md"
          fontWeight="400"
          px={2}
          gap={1.5}
          _hover={{ color: "fg", bg: "bg.muted" }}
        >
          <Link to="/integrations">
            <FiArrowLeft size={14} />
            Integrations
          </Link>
        </Button>
      </Box>

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
            Listmonk
          </Heading>
          <Text fontSize="sm" color="fg.muted">
            Self-hosted newsletter & mailing list manager.
          </Text>
        </Box>
        <Button
          size="sm"
          bg="fg"
          color="bg"
          borderRadius="md"
          fontWeight="500"
          _hover={{ opacity: 0.85 }}
          gap={1.5}
          flexShrink={0}
          onClick={() => setModalOpen(true)}
        >
          <FiPlus size={14} />
          Add new
        </Button>
      </Flex>

      {/* Instance list */}
      <Box maxW="2xl">
        {loading ? (
          <Text fontSize="sm" color="fg.muted">
            Loading…
          </Text>
        ) : integrations.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            gap={3}
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            borderStyle="dashed"
            py={14}
          >
            <Text fontSize="sm" color="fg.muted">
              No Listmonk instances connected yet.
            </Text>
            <Button
              size="sm"
              bg="fg"
              color="bg"
              borderRadius="md"
              fontWeight="500"
              _hover={{ opacity: 0.85 }}
              gap={1.5}
              onClick={() => setModalOpen(true)}
            >
              <FiPlus size={14} />
              Add new
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" gap={2}>
            {integrations.map((integration) => (
              <Link
                key={integration.id}
                to={`/integrations/listmonk/${integration.id}`}
              >
                <Flex
                  align="center"
                  justify="space-between"
                  p={4}
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="lg"
                  bg="bg.subtle"
                  gap={3}
                  cursor="pointer"
                  _hover={{ borderColor: "fg.muted", bg: "bg.muted" }}
                  transition="all 0.15s"
                >
                  <Box minW={0} flex={1}>
                    <Text
                      fontSize="sm"
                      fontFamily="mono"
                      color="fg"
                      truncate
                      mb={0.5}
                    >
                      {integration.url}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {integration.username}
                    </Text>
                  </Box>
                  <Box color="fg.muted" flexShrink={0}>
                    <FiChevronRight size={16} />
                  </Box>
                </Flex>
              </Link>
            ))}
          </Flex>
        )}
      </Box>

      <ConnectListmonkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnected={(integration) => {
          setIntegrations((prev) => [integration, ...prev]);
          setModalOpen(false);
        }}
      />
    </Container>
  );
}
