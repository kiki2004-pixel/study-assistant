import {
  Badge,
  Box,
  Card,
  Collapsible,
  Flex,
  IconButton,
  Progress,
  Text,
} from "@chakra-ui/react";
import { FiChevronDown, FiChevronUp, FiZap } from "react-icons/fi";
import { ActiveJobsList } from "@app/components/lists/active-jobs-list";
import type { ActiveValidationJob } from "types/jobs";

interface ActiveJobsCardProps {
  jobs: ActiveValidationJob[];
  isExpanded: boolean;
  totalProgress: number;
  onToggleExpanded: () => void;
}

export function ActiveJobsCard({
  jobs,
  isExpanded,
  totalProgress,
  onToggleExpanded,
}: ActiveJobsCardProps) {
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
                onClick={onToggleExpanded}
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
            <ActiveJobsList jobs={jobs} />
          </Collapsible.Content>
        </Card.Body>
      </Card.Root>
    </Collapsible.Root>
  );
}
