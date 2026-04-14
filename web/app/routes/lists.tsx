import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { AuthenticatedNavbar } from "@app/components/navbar/authenticated-navbar";
import { getBulkHistory, getHistory, type HistoryParams } from "api/history";
import type { HistoryEntry, HistoryPage } from "types/history";

const PAGE_SIZE = 20;

function StatusBadge({ isValid }: { isValid: boolean }) {
  return (
    <Badge
      px={2}
      py={0.5}
      borderRadius="full"
      fontSize="xs"
      fontWeight={500}
      bg={isValid ? "#dcfce7" : "#fee2e2"}
      color={isValid ? "#15803d" : "#b91c1c"}
      border="1px solid"
      borderColor={isValid ? "#bbf7d0" : "#fecaca"}
    >
      {isValid ? "Valid" : "Invalid"}
    </Badge>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Flex direction="column" align="center" justify="center" py={20} gap={2}>
      <Text fontSize="lg" fontWeight={600} color="fg">
        No history found
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {filtered
          ? "Try adjusting your filters."
          : "Validated emails will appear here."}
      </Text>
    </Flex>
  );
}

function BulkDrawer({
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
        w={{ base: "100%", md: "560px" }}
        bg="bg.subtle"
        boxShadow="xl"
        overflowY="auto"
        onClick={(e) => e.stopPropagation()}
        p={6}
      >
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading fontSize="lg" fontWeight={600} mb={1}>
              Bulk Job Results
            </Heading>
            <Text
              fontSize="xs"
              color="fg.muted"
              fontFamily="Geist Mono, monospace"
            >
              {requestId}
            </Text>
          </Box>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner />
          </Flex>
        ) : entries.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            No results found.
          </Text>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Score</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {entries.map((e) => (
                <Table.Row key={e.id}>
                  <Table.Cell
                    fontFamily="Geist Mono, monospace"
                    fontSize="xs"
                    maxW="220px"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {e.email}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge isValid={e.is_valid} />
                  </Table.Cell>
                  <Table.Cell
                    fontFamily="Geist Mono, monospace"
                    fontSize="xs"
                    color="fg.muted"
                  >
                    {e.quality_score ?? "—"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>
    </Box>
  );
}

export default function Lists() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<HistoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterValid, setFilterValid] = useState<boolean | undefined>(
    undefined,
  );
  const [emailSearch, setEmailSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeBulkId, setActiveBulkId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  const fetchHistory = useCallback(
    (params: HistoryParams) => {
      if (!auth.user?.access_token) return;
      setLoading(true);
      getHistory(auth.user.access_token, params)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [auth.user?.access_token],
  );

  useEffect(() => {
    fetchHistory({ page, page_size: PAGE_SIZE, is_valid: filterValid });
  }, [page, filterValid, fetchHistory]);

  if (auth.isLoading || !auth.isAuthenticated) return null;

  const token = auth.user!.access_token;
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const isFiltered = filterValid !== undefined || emailSearch !== "";

  const displayedEntries = emailSearch
    ? (data?.results ?? []).filter((e) =>
        e.email.toLowerCase().includes(emailSearch.toLowerCase()),
      )
    : (data?.results ?? []);

  function handleFilterToggle(value: boolean | undefined) {
    setFilterValid(value);
    setPage(1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailSearch(searchInput);
    setPage(1);
  }

  function handleSearchClear() {
    setSearchInput("");
    setEmailSearch("");
    setPage(1);
  }

  return (
    <Box minH="100vh" bg="bg">
      <AuthenticatedNavbar />

      {activeBulkId && (
        <BulkDrawer
          requestId={activeBulkId}
          token={token}
          onClose={() => setActiveBulkId(null)}
        />
      )}

      <Container maxW="7xl" py={10}>
        {/* Header */}
        <Box mb={8}>
          <Heading
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight={600}
            letterSpacing="-0.02em"
            mb={1}
          >
            History
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            All email validations, newest first.
          </Text>
        </Box>

        {/* Filters */}
        <Flex gap={3} mb={6} align="center" wrap="wrap" justify="space-between">
          {/* Valid / Invalid toggle */}
          <Flex gap={2}>
            {(
              [
                { label: "All", value: undefined },
                { label: "Valid", value: true },
                { label: "Invalid", value: false },
              ] as { label: string; value: boolean | undefined }[]
            ).map(({ label, value }) => (
              <Button
                key={label}
                size="sm"
                borderRadius="full"
                variant={filterValid === value ? "solid" : "outline"}
                bg={filterValid === value ? "#22C55E" : undefined}
                color={filterValid === value ? "white" : "fg.muted"}
                borderColor="border"
                _hover={{ bg: filterValid === value ? "#16a34a" : "bg.muted" }}
                onClick={() => handleFilterToggle(value)}
              >
                {label}
              </Button>
            ))}
          </Flex>

          {/* Email search */}
          <form onSubmit={handleSearchSubmit}>
            <Flex gap={2}>
              <Input
                placeholder="Search by email…"
                size="sm"
                borderRadius="md"
                borderColor="border"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                fontFamily="DM Sans, sans-serif"
                w="240px"
              />
              <Button
                size="sm"
                type="submit"
                variant="outline"
                borderColor="border"
                borderRadius="md"
              >
                Search
              </Button>
              {emailSearch && (
                <Button
                  size="sm"
                  variant="ghost"
                  borderRadius="md"
                  onClick={handleSearchClear}
                >
                  Clear
                </Button>
              )}
            </Flex>
          </form>
        </Flex>

        {/* Table */}
        <Box
          bg="bg.subtle"
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          overflow="hidden"
        >
          {loading ? (
            <Flex justify="center" py={16}>
              <Spinner color="#22C55E" />
            </Flex>
          ) : displayedEntries.length === 0 ? (
            <EmptyState filtered={isFiltered} />
          ) : (
            <Table.Root size="md">
              <Table.Header>
                <Table.Row bg="bg.muted">
                  <Table.ColumnHeader
                    fontFamily="DM Sans, sans-serif"
                    fontSize="xs"
                    fontWeight={500}
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="fg.muted"
                    py={3}
                    px={4}
                  >
                    Email
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    fontFamily="DM Sans, sans-serif"
                    fontSize="xs"
                    fontWeight={500}
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="fg.muted"
                    py={3}
                  >
                    Status
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    fontFamily="DM Sans, sans-serif"
                    fontSize="xs"
                    fontWeight={500}
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="fg.muted"
                    py={3}
                  >
                    Score
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    fontFamily="DM Sans, sans-serif"
                    fontSize="xs"
                    fontWeight={500}
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="fg.muted"
                    py={3}
                  >
                    Validated At
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    fontFamily="DM Sans, sans-serif"
                    fontSize="xs"
                    fontWeight={500}
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="fg.muted"
                    py={3}
                    px={4}
                  >
                    Bulk Job
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {displayedEntries.map((entry) => (
                  <Table.Row
                    key={entry.id}
                    _hover={{ bg: "bg.muted" }}
                    transition="background 0.1s"
                  >
                    <Table.Cell
                      px={4}
                      fontFamily="Geist Mono, monospace"
                      fontSize="sm"
                      fontWeight={500}
                    >
                      {entry.email}
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge isValid={entry.is_valid} />
                    </Table.Cell>
                    <Table.Cell
                      fontFamily="Geist Mono, monospace"
                      fontSize="sm"
                      color="fg.muted"
                    >
                      {entry.quality_score ?? "—"}
                    </Table.Cell>
                    <Table.Cell fontSize="sm" color="fg.muted">
                      {new Date(entry.validated_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Table.Cell>
                    <Table.Cell px={4}>
                      {entry.request_id ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          borderRadius="md"
                          fontFamily="Geist Mono, monospace"
                          fontSize="xs"
                          color="fg.muted"
                          _hover={{ color: "fg", bg: "bg.muted" }}
                          onClick={() => setActiveBulkId(entry.request_id!)}
                        >
                          {entry.request_id.slice(0, 8)}…
                        </Button>
                      ) : (
                        <Text fontSize="sm" color="fg.muted">
                          —
                        </Text>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={4}>
            <Text fontSize="sm" color="fg.muted">
              Page {page} of {totalPages} — {data?.total ?? 0} total
            </Text>
            <Flex gap={2}>
              <Button
                size="sm"
                variant="outline"
                borderRadius="md"
                borderColor="border"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderRadius="md"
                borderColor="border"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </Flex>
          </Flex>
        )}
      </Container>
    </Box>
  );
}
