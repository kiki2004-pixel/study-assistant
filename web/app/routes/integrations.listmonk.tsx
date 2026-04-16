import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
} from "@chakra-ui/react";
import { FiArrowLeft, FiList } from "react-icons/fi";
import { Link } from "react-router";
import { getListmonkLists, getListmonkIntegration } from "api/integrations";
import { ListmonkListCard } from "@app/components/lists/listmonk-list-card";
import type { ListmonkList } from "@types/integrations";

export default function IntegrationsListmonk() {
  const [lists, setLists] = useState<ListmonkList[]>([]);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getListmonkIntegration()
      .then((integration) => {
        setUrl(integration.url);
        return getListmonkLists();
      })
      .then(setLists)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
          {url && (
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              {url}
            </Text>
          )}
        </Box>
      </Flex>

      {/* Lists */}
      <Box>
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

        {loading ? (
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
        ) : error ? (
          <Box
            borderWidth="1px"
            borderColor="border"
            borderRadius="md"
            px={4}
            py={6}
          >
            <Text fontSize="sm" color="red.500" textAlign="center">
              {error}
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
    </Container>
  );
}
