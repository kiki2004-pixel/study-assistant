import { useEffect, useState } from "react";
import { Box, Button, Container, Flex, Heading, Text } from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
import {
  deleteListmonkIntegration,
  getListmonkIntegration,
  getListmonkLists,
} from "api/integrations";
import { ListmonkLists } from "@app/components/lists/listmonk-lists";
import type { Integration, ListmonkList } from "~types/integrations";

export default function IntegrationsListmonkDetail() {
  const { id } = useParams<{ id: string }>();
  const integrationId = Number(id);
  const navigate = useNavigate();

  const [integration, setIntegration] = useState<Integration | null>(null);
  const [lists, setLists] = useState<ListmonkList[]>([]);
  const [loading, setLoading] = useState(true);
  const [listsError, setListsError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    Promise.all([
      getListmonkIntegration(integrationId),
      getListmonkLists(integrationId),
    ])
      .then(([integration, lists]) => {
        setIntegration(integration);
        setLists(lists as ListmonkList[]);
      })
      .catch((e) => setListsError(e.message))
      .finally(() => setLoading(false));
  }, [integrationId]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await deleteListmonkIntegration(integrationId);
      navigate("/integrations/listmonk");
    } catch {
      setDisconnecting(false);
    }
  }

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
          <Link to="/integrations/listmonk">
            <FiArrowLeft size={14} />
            Listmonk
          </Link>
        </Button>
      </Box>

      {/* Header */}
      <Flex align="flex-start" justify="space-between" mb={8} gap={4}>
        <Box minW={0}>
          <Heading
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="400"
            fontFamily="mono"
            letterSpacing="-0.02em"
            mb={1}
            truncate
          >
            {integration?.url ?? "…"}
          </Heading>
          {integration && (
            <Text fontSize="xs" color="fg.muted">
              {integration.username}
            </Text>
          )}
        </Box>

        {/* Disconnect */}
        <Flex align="center" gap={2} flexShrink={0}>
          {confirmDisconnect ? (
            <>
              <Text fontSize="xs" color="fg.muted">
                Disconnect?
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
              size="sm"
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
      </Flex>

      <ListmonkLists lists={lists} loading={loading} error={listsError} />
    </Container>
  );
}
