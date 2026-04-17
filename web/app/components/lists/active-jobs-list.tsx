import { Box, Flex, Progress, Text, VStack } from "@chakra-ui/react";
import { FiLoader } from "react-icons/fi";

interface ActiveValidationJob {
  requestId: string;
  jobType: string;
  status: string;
  listName: string | null;
  totalItems: number;
  processedItems: number;
  progressPercentage: number;
  createdAt: string;
}

interface ActiveJobsListProps {
  jobs: ActiveValidationJob[];
}

export function ActiveJobsList({ jobs }: ActiveJobsListProps) {
  return (
    <VStack gap={3} align="stretch" mt={3}>
      {jobs.map((job) => (
        <Box
          key={job.requestId}
          p={3}
          bg="bg.subtle"
          borderRadius="md"
          borderWidth="1px"
          borderColor="border"
        >
          <Flex justify="space-between" align="center" mb={2}>
            <Flex align="center" gap={2}>
              {job.status === "running" && (
                <FiLoader size={12} className="spin" />
              )}
              <Text fontSize="xs" fontWeight="500">
                {job.listName || "List Validation"}
              </Text>
            </Flex>
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              {job.processedItems.toLocaleString()} /{" "}
              {job.totalItems.toLocaleString()}
            </Text>
          </Flex>

          <Progress.Root size="xs">
            <Progress.Track bg="bg.muted">
              <Progress.Range
                bg={job.status === "completed" ? "green.500" : "yellow.500"}
                w={`${job.progressPercentage}%`}
                transition="width 0.3s ease"
                rounded="full"
              />
            </Progress.Track>
          </Progress.Root>

          <Flex justify="space-between" mt={1}>
            <Text fontSize="2xs" color="fg.muted" textTransform="capitalize">
              {job.status}
            </Text>
            <Text fontSize="2xs" color="fg.muted">
              {job.progressPercentage}%
            </Text>
          </Flex>
        </Box>
      ))}
    </VStack>
  );
}
