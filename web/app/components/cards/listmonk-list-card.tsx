import { useState } from "react";
import { Badge, Box, Button, Flex, Text } from "@chakra-ui/react";
import { FiLoader, FiUsers, FiZap } from "react-icons/fi";
import { validateListmonkList } from "api/integrations";
import { JobProgressModal } from "@app/components/modals/job-progress-modal";
import type { ListmonkList } from "~types/integrations";

interface ListmonkListCardProps {
  list: ListmonkList;
  integrationId: number;
}

export function ListmonkListCard({
  list,
  integrationId,
}: ListmonkListCardProps) {
  const [validating, setValidating] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(
    list.active_job_request_id ?? null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate(e: React.MouseEvent) {
    e.stopPropagation();
    setValidating(true);
    setError(null);
    try {
      const res = await validateListmonkList(integrationId, list.id);
      setActiveRequestId(res.request_id);
      setModalOpen(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start validation.");
    } finally {
      setValidating(false);
    }
  }

  return (
    <>
      <Flex
        direction="column"
        gap={3}
        p={4}
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        bg="bg.subtle"
        cursor={activeRequestId ? "pointer" : "default"}
        onClick={() => activeRequestId && setModalOpen(true)}
        _hover={activeRequestId ? { borderColor: "yellow.400" } : undefined}
        transition="border-color 0.15s ease"
      >
        <Flex align="flex-start" justify="space-between" gap={2}>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="500" truncate mb={0.5}>
              {list.name}
            </Text>
            <Flex align="center" gap={1.5}>
              <Box color="fg.muted">
                <FiUsers size={11} />
              </Box>
              <Text fontSize="xs" color="fg.muted" fontFamily="mono">
                {list.subscriber_count.toLocaleString()} subscribers
              </Text>
            </Flex>
          </Box>
          <Flex align="center" gap={2} flexShrink={0}>
            {list.type && (
              <Badge
                size="sm"
                variant="subtle"
                borderRadius="full"
                px={2}
                fontSize="10px"
                textTransform="capitalize"
              >
                {list.type}
              </Badge>
            )}
            {activeRequestId && (
              <Badge
                size="sm"
                colorPalette="yellow"
                borderRadius="full"
                px={2}
                fontSize="10px"
                gap={1}
              >
                <FiLoader size={9} className="spin" />
                In progress
              </Badge>
            )}
          </Flex>
        </Flex>

        {!activeRequestId && (
          <Flex direction="column" gap={1.5}>
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              borderRadius="md"
              fontWeight="500"
              alignSelf="flex-start"
              gap={1.5}
              loading={validating}
              onClick={handleValidate}
            >
              <FiZap size={11} />
              Validate list
            </Button>
            {error && (
              <Text fontSize="xs" color="red.500">
                {error}
              </Text>
            )}
          </Flex>
        )}

        {activeRequestId && (
          <Text fontSize="xs" color="fg.muted">
            Click to view progress
          </Text>
        )}
      </Flex>

      {activeRequestId && (
        <JobProgressModal
          requestId={activeRequestId}
          listName={list.name}
          totalItems={list.subscriber_count}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// CSS for spin animation — consumed by layout or root
const styles = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin {
  animation: spin 1s linear infinite;
}
`;

export function ListCardStyles() {
  return <style>{styles}</style>;
}
