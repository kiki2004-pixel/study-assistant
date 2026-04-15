import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import {
  Box,
  Button,
  Flex,
  Heading,
  Pagination,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { getHistory } from "api/history";
import type { HistoryPage, HistoryParams } from "types/history";
import { StatusBadge } from "@app/components/badges/status-badge";
import { EmptyStateCard } from "@app/components/cards/empty-state-card";
import { BulkDrawerCard } from "@app/components/cards/bulk-drawer-card";
import { HistorySearchForm } from "@app/components/forms/history-search-form";

const PAGE_SIZE = 20;

const FILTERS: { label: string; value: boolean | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Valid", value: true },
  { label: "Invalid", value: false },
];

export default function HistorySettings() {
  const auth = useAuth();

  const [data, setData] = useState<HistoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterValid, setFilterValid] = useState<boolean | undefined>(
    undefined,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState<HistoryParams | null>(null);
  const [activeBulkId, setActiveBulkId] = useState<string | null>(null);

  const token = auth.user?.access_token ?? "";

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
    if (searchQuery) {
      fetchHistory({ page_size: PAGE_SIZE, ...searchQuery });
    } else {
      fetchHistory({ page, page_size: PAGE_SIZE, is_valid: filterValid });
    }
  }, [page, filterValid, searchQuery, fetchHistory]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const isSearchActive = searchQuery !== null;
  const isFiltered = filterValid !== undefined || isSearchActive;
  const displayedEntries = data?.results ?? [];

  function handleFilterToggle(value: boolean | undefined) {
    setFilterValid(value);
    setPage(1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    const params: HistoryParams = query.includes("@")
      ? { email: query }
      : { request_id: query };

    setSearchQuery(params);
  }

  function handleSearchClear() {
    setSearchInput("");
    setSearchQuery(null);
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
      {data && data.total > 0 && !isSearchActive && (
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

      {/* Filters + Search */}
      <Flex gap={3} mb={4} align="center" justify="space-between" wrap="wrap">
        {!isSearchActive && (
          <Flex gap={2}>
            {FILTERS.map(({ label, value }) => (
              <Button
                key={label}
                size="sm"
                borderRadius="full"
                variant={filterValid === value ? "solid" : "outline"}
                bg={filterValid === value ? "brand.solid" : undefined}
                color={filterValid === value ? "brand.contrast" : "fg.muted"}
                borderColor="border"
                _hover={{
                  bg: filterValid === value ? "brand.600" : "bg.muted",
                }}
                onClick={() => handleFilterToggle(value)}
              >
                {label}
              </Button>
            ))}
          </Flex>
        )}

        <Box ml="auto">
          <HistorySearchForm
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearchSubmit}
            onClear={handleSearchClear}
            isActive={isSearchActive}
            loading={loading && isSearchActive}
          />
        </Box>
      </Flex>

      {/* Search label */}
      {isSearchActive && data && (
        <Text fontSize="xs" color="fg.muted" mb={3}>
          {searchQuery?.email
            ? `All validations for ${searchQuery.email}`
            : `All results for bulk job ${searchQuery?.request_id?.slice(0, 8)}…`}{" "}
          — {data.total} found
        </Text>
      )}

      {/* List */}
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
          <Flex direction="column">
            {/* Column headers */}
            <Flex
              px={4}
              py={2}
              bg="bg.muted"
              borderBottomWidth="1px"
              borderColor="border"
              gap={3}
            >
              <Text
                fontSize="xs"
                fontWeight={500}
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="fg.muted"
                flex={1}
              >
                Email
              </Text>
              <Text
                fontSize="xs"
                fontWeight={500}
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="fg.muted"
                w="72px"
              >
                Status
              </Text>
              <Text
                fontSize="xs"
                fontWeight={500}
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="fg.muted"
                w="48px"
                textAlign="right"
              >
                Score
              </Text>
              <Text
                fontSize="xs"
                fontWeight={500}
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="fg.muted"
                w="140px"
              >
                Validated At
              </Text>
              <Text
                fontSize="xs"
                fontWeight={500}
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="fg.muted"
                w="80px"
              >
                Bulk Job
              </Text>
            </Flex>

            {displayedEntries.map((entry) => (
              <Flex
                key={entry.id}
                px={4}
                py={3}
                gap={3}
                align="center"
                borderBottomWidth="1px"
                borderColor="border"
                _last={{ borderBottomWidth: 0 }}
                _hover={{ bg: "bg.muted" }}
                transition="background 0.1s"
              >
                {/* Email */}
                <Flex align="center" gap={2.5} flex={1} minW={0}>
                  <Box
                    w={1.5}
                    h={1.5}
                    borderRadius="full"
                    bg={entry.is_valid ? "valid.fg" : "invalid.fg"}
                    flexShrink={0}
                  />
                  <Text
                    fontSize="sm"
                    fontFamily="Geist Mono, monospace"
                    fontWeight={500}
                    color="fg"
                    truncate
                  >
                    {entry.email}
                  </Text>
                </Flex>

                {/* Status */}
                <Box w="72px">
                  <StatusBadge isValid={entry.is_valid} />
                </Box>

                {/* Score */}
                <Text
                  fontSize="sm"
                  fontFamily="Geist Mono, monospace"
                  color="fg.muted"
                  w="48px"
                  textAlign="right"
                >
                  {entry.quality_score ?? "—"}
                </Text>

                {/* Validated At */}
                <Text fontSize="xs" color="fg.muted" w="140px">
                  {new Date(entry.validated_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>

                {/* Bulk Job */}
                <Box w="80px">
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
                </Box>
              </Flex>
            ))}
          </Flex>
        )}
      </Box>

      {/* Pagination — hidden during search */}
      {!loading && !isSearchActive && totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={4}>
          <Text fontSize="sm" color="fg.muted">
            Page {page} of {totalPages} — {data?.total ?? 0} total
          </Text>
          <Pagination.Root
            count={data?.total ?? 0}
            pageSize={PAGE_SIZE}
            page={page}
            onPageChange={(details) => setPage(details.page)}
          >
            <Flex gap={1}>
              <Pagination.PrevTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="md"
                  borderColor="border"
                >
                  Previous
                </Button>
              </Pagination.PrevTrigger>
              <Pagination.NextTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="md"
                  borderColor="border"
                >
                  Next
                </Button>
              </Pagination.NextTrigger>
            </Flex>
          </Pagination.Root>
        </Flex>
      )}
    </Box>
  );
}
