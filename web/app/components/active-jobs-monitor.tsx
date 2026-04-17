import { useEffect, useState } from "react";
import { listActiveJobs, getJobProgress } from "api/jobs";
import { ActiveJobsCard } from "@app/components/cards/active-jobs-card";
import type { ActiveValidationJob } from "types/jobs";

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
    <ActiveJobsCard
      jobs={jobs}
      isExpanded={isExpanded}
      totalProgress={totalProgress}
      onToggleExpanded={() => setIsExpanded(!isExpanded)}
    />
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
