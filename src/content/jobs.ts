import type { ContentCollection, JobPosting } from "@/types/content";

export const jobs: ContentCollection<JobPosting> = {
  sourceState: "pending",
  records: [],
};
