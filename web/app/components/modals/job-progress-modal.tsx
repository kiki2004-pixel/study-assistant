import { useEffect, useRef, useState } from "react";
import { Box, CloseButton, Dialog, Flex, Text } from "@chakra-ui/react";
import { getJobProgress } from "api/jobs";

interface JobProgressModalProps {
  requestId: string;
  listName: string;
  totalItems: number;
  open: boolean;
  onClose: () => void;
}

export function JobProgressModal({
  requestId,
  listName,
  totalItems,
  open,
  onClose,
}: JobProgressModalProps) {
  const [processedItems, setProcessedItems] = useState(0);
  const [status, setStatus] = useState("pending");
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    async function fetchProgress() {
      try {
        const p = await getJobProgress(requestId);
        setProcessedItems(p.processed_items);
        setStatus(p.status);
        setValidCount(p.valid_count);
        setInvalidCount(p.invalid_count);
        if (p.is_complete && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        // silently ignore
      }
    }

    fetchProgress();
    pollRef.current = setInterval(fetchProgress, 2000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open, requestId]);

  const isComplete =
    status === "completed" || status === "failed" || status === "cancelled";
  const pct =
    totalItems > 0
      ? Math.min(Math.round((processedItems / totalItems) * 100), 100)
      : 0;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="sm" borderRadius="xl" bg="bg">
          <Dialog.Header pb={2}>
            <Dialog.Title fontSize="sm" fontWeight="500">
              {listName}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body pb={6}>
            <Flex justify="space-between" mb={2}>
              <Text fontSize="xs" color="fg.muted">
                {isComplete ? "Validation complete" : "Validating…"}
              </Text>
              <Text fontSize="xs" color="fg.muted" fontFamily="mono">
                {processedItems.toLocaleString()} /{" "}
                {totalItems.toLocaleString()}
              </Text>
            </Flex>

            <Box
              h="3px"
              borderRadius="full"
              bg="bg.muted"
              overflow="hidden"
              mb={4}
            >
              <Box
                h="100%"
                borderRadius="full"
                bg={isComplete ? "green.500" : "yellow.400"}
                w={`${pct}%`}
                transition="width 0.4s ease"
              />
            </Box>

            <Flex gap={4}>
              <Box>
                <Text fontSize="2xs" color="fg.muted" mb={0.5}>
                  Valid
                </Text>
                <Text fontSize="sm" fontFamily="mono" color="green.500">
                  {validCount.toLocaleString()}
                </Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="fg.muted" mb={0.5}>
                  Invalid
                </Text>
                <Text fontSize="sm" fontFamily="mono" color="red.500">
                  {invalidCount.toLocaleString()}
                </Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="fg.muted" mb={0.5}>
                  Progress
                </Text>
                <Text fontSize="sm" fontFamily="mono">
                  {pct}%
                </Text>
              </Box>
            </Flex>

            {status === "failed" && (
              <Text fontSize="xs" color="red.500" mt={3}>
                Job failed.
              </Text>
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
