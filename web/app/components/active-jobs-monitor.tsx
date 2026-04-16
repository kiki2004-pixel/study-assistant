import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Card,
  CardBody,
  Collapsible,
  Flex,
  IconButton,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiChevronDown, FiChevronUp, FiLoader, FiZap } from "react-icons/fi";
import { listActiveJobs, getJobProgress, type ActiveJobItem } from "api/jobs";

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

export function ActiveJobsMonitor() {
  const [jobs, setJobs] = useState<ActiveValidationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchActiveJobs();
    const interval = setInterval(fetchActiveJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchActiveJobs() {
    setLoading(true);
    try {
      const activeJobs = await listActiveJobs();
      const jobsWithProgress = await Promise.all(
        activeJobs.map(async (job) => {
          try {
            const progress = await getJobProgress(job.request_id);
            return {
              requestId: job.request_id,
              jobType: job.job_type,
              status: progress.status,
              listName: job.list_name,
              totalItems: progress.total_items,
              processedItems: progress.processed_items,
              progressPercentage: progress.progress_percentage,
              createdAt: job.created_at,
            };
          } catch {
            // Fallback if progress fetch fails
            return {
              requestId: job.request_id,
              jobType: job.job_type,
              status: job.status,
              listName: job.list_name,
              totalItems: job.total_items,
              processedItems: job.processed_items,
              progressPercentage: job.progress_percentage,
              createdAt: job.created_at,
            };
          }
        }),
      );
      setJobs(jobsWithProgress);
    } catch {
      // Silently fail - not critical
    } finally {
      setLoading(false);
    }
  }

  if (jobs.length === 0) {
    return null;
  }

  const totalProgress =
    jobs.reduce((sum, j) => sum + j.progressPercentage, 0) / jobs.length;

  return (
    <Collapsible.Root open={isExpanded}>
      <Card.Root variant="outline" size="sm" mb={4}>
        <Card.Body>
          {/* Header */}
          <Flex
            justify="space-between"
            align="center"
            mb={isExpanded && jobs.length > 0 ? 3 : 0}
          >
            <Flex align="center" gap={2}>
              <Box color="yellow.500">
                <FiZap size={14} />
              </Box>
              <Text fontSize="sm" fontWeight="500">
                Active Validations
              </Text>
              <Badge size="sm" colorPalette="yellow" borderRadius="full">
                {jobs.length}
              </Badge>
              {!isExpanded && jobs.length > 0 && (
                <Progress.Root w={16} size="xs">
                  <Progress.Track bg="yellow.100" _dark={{ bg: "yellow.900" }}>
                    <Progress.Range
                      bg="yellow.500"
                      w={`${totalProgress}%`}
                      rounded="full"
                    />
                  </Progress.Track>
                </Progress.Root>
              )}
            </Flex>
            <Collapsible.Trigger asChild>
              <IconButton
                size="xs"
                variant="ghost"
                aria-label={isExpanded ? "Collapse" : "Expand"}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <FiChevronUp size={14} />
                ) : (
                  <FiChevronDown size={14} />
                )}
              </IconButton>
            </Collapsible.Trigger>
          </Flex>

          {/* Job List */}
          <Collapsible.Content>
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
                        bg={
                          job.status === "completed"
                            ? "green.500"
                            : "yellow.500"
                        }
                        w={`${job.progressPercentage}%`}
                        transition="width 0.3s ease"
                        rounded="full"
                      />
                    </Progress.Track>
                  </Progress.Root>

                  <Flex justify="space-between" mt={1}>
                    <Text
                      fontSize="2xs"
                      color="fg.muted"
                      textTransform="capitalize"
                    >
                      {job.status}
                    </Text>
                    <Text fontSize="2xs" color="fg.muted">
                      {job.progressPercentage}%
                    </Text>
                  </Flex>
                </Box>
              ))}
            </VStack>
          </Collapsible.Content>
        </Card.Body>
      </Card.Root>
    </Collapsible.Root>
  );
}

// CSS for spin animation
const styles = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin {
  animation: spin 1s linear infinite;
}
`;

export function ActiveJobsStyles() {
  return <style>{styles}</style>;
}
