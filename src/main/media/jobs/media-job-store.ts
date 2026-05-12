import type { MediaJob } from '../../../shared/media'

export class MediaJobStore {
  private readonly jobs = new Map<string, MediaJob>()

  create(job: MediaJob): MediaJob {
    this.jobs.set(job.id, job)
    return job
  }

  get(jobId: string): MediaJob | undefined {
    return this.jobs.get(jobId)
  }

  update(jobId: string, patch: Partial<MediaJob>): MediaJob {
    const current = this.jobs.get(jobId)
    if (!current) {
      throw new Error(`Job not found: ${jobId}`)
    }

    const updated = { ...current, ...patch }
    this.jobs.set(jobId, updated)
    return updated
  }
}
