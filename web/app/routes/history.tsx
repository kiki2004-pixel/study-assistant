import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Box, Button, Flex, Heading, Input, Spinner, Table, Text } from "@chakra-ui/react";
import { getHistory, type HistoryParams } from "api/history";
import type { HistoryPage } from "types/history";
import { StatusBadge } from "@app/components/cards/status-badge";
import { EmptyStateCard } from "@app/components/cards/empty-state-card";
import { BulkDrawerCard } from "@app/components/cards/bulk-drawer-card";

const PAGE_SIZE = 20;

export default function HistorySettings() {
  const auth = useAuth();

  const [data, setData] = useState<HistoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterValid, setFilterValid] = useState<boolean | undefined>(undefined);
  const [emailSearch, setEmailSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeBulkId, setActiveBulkId] = useState<string | null>(null);

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

  const token = auth.user?.access_token ?? "";
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
    <Box>
      {activeBulkId && (
        <BulkDrawerCard
          requestId={activeBulkId}
          token={token}
          onClose={() => setActiveBulkId(null)}
        />
      )}

      <Heading
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="400"
        letterSpacing="-0.02em"
        mb={2}
      >
        History
      </Heading>
      <Text fontSize="sm" color="fg.muted" mb={6}>
        All email validations, newest first.
      </Text>

      {/* Stats */}
      {data && data.total > 0 && (
        <Flex gap={3} mb={6}>
          <Box
            bg="bg.muted"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            px={4}
            py={3}
            flex={1}
          >
            <Text fontSize="xs" color="fg.muted" fontWeight={500} mb={1}>
              Total
            </Text>
            <Text
              fontSize="2xl"
              fontWeight={700}
              fontFamily="Geist Mono, monospace"
              color="fg"
            >
              {data.total}
            </Text>
          </Box>
          <Box
            bg="valid.bg"
            border="1px solid"
            borderColor="valid.border"
            borderRadius="lg"
            px={4}
            py={3}
            flex={1}
          >
            <Text fontSize="xs" color="valid.fg" fontWeight={500} mb={1}>
              Valid
            </Text>
            <Text
              fontSize="2xl"
              fontWeight={700}
              fontFamily="Geist Mono, monospace"
              color="valid.fg"
            >
              {data.results.filter((r) => r.is_valid).length}
            </Text>
          </Box>
          <Box
            bg="invalid.bg"
            border="1px solid"
            borderColor="invalid.border"
            borderRadius="lg"
            px={4}
            py={3}
            flex={1}
          >
            <Text fontSize="xs" color="invalid.fg" fontWeight={500} mb={1}>
              Invalid
            </Text>
            <Text
              fontSize="2xl"
              fontWeight={700}
              fontFamily="Geist Mono, monospace"
              color="invalid.fg"
            >
              {data.results.filter((r) => !r.is_valid).length}
            </Text>
          </Box>
        </Flex>
      )}

      {/* Filters */}
      <Flex gap={3} mb={4} align="center" justify="space-between" wrap="wrap">
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
              bg={filterValid === value ? "brand.solid" : undefined}
              color={filterValid === value ? "brand.contrast" : "fg.muted"}
              borderColor="border"
              _hover={{ bg: filterValid === value ? "brand.600" : "bg.muted" }}
              onClick={() => handleFilterToggle(value)}
            >
              {label}
            </Button>
          ))}
        </Flex>

        <form onSubmit={handleSearchSubmit}>
          <Flex gap={2}>
            <Input
              placeholder="Search by email…"
              size="sm"
              borderRadius="md"
              borderColor="border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              w="200px"
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
            <Spinner color="brand.solid" />
          </Flex>
        ) : displayedEntries.length === 0 ? (
          <EmptyStateCard filtered={isFiltered} />
        ) : (
          <Table.Root size="md">
            <Table.Header>
              <Table.Row bg="bg.muted">
                {["Email", "Status", "Score", "Validated At", "Bulk Job"].map(
                  (col) => (
                    <Table.ColumnHeader
                      key={col}
                      fontSize="xs"
                      fontWeight={500}
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      color="fg.muted"
                      py={3}
                      px={col === "Email" || col === "Bulk Job" ? 4 : undefined}
                    >
                      {col}
                    </Table.ColumnHeader>
                  ),
                )}
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
    </Box>
  );
}
