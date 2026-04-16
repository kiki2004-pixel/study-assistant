import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { FiList } from "react-icons/fi";
import { ListmonkListCard } from "@app/components/cards/listmonk-list-card";
import type { ListmonkList } from "~types/integrations";

interface ListmonkListsProps {
  integrationId: number;
  lists: ListmonkList[];
  loading: boolean;
  error: string | null;
}

export function ListmonkLists({
  integrationId,
  lists,
  loading,
  error,
}: ListmonkListsProps) {
  return (
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
            No lists found in this Listmonk instance.
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
            <ListmonkListCard
              key={list.id}
              list={list}
              integrationId={integrationId}
            />
          ))}
        </Grid>
      )}
    </Box>
  );
}
