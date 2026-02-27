export interface StoredJob {
  id: string;
  manifests: Record<string, string>;
  warnings: string[];
  createdAt: number;
}

class JobStore {
  private readonly jobs = new Map<string, StoredJob>();

  constructor(private readonly ttlMs: number) {}

  set(job: StoredJob): void {
    this.jobs.set(job.id, job);
    this.cleanupExpired();
  }

  get(id: string): StoredJob | undefined {
    this.cleanupExpired();
    return this.jobs.get(id);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - job.createdAt > this.ttlMs) {
        this.jobs.delete(id);
      }
    }
  }
}

const ttlMinutes = Number.parseInt(process.env.JOB_TTL_MINUTES ?? "30", 10);
const ttlMs = Number.isNaN(ttlMinutes) ? 30 * 60 * 1000 : ttlMinutes * 60 * 1000;

export const jobStore = new JobStore(ttlMs);
