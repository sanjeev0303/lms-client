/**
 * Analytics Batching System
 * Batches analytics events and progress updates to reduce API calls
 * OPTIMIZATION: Groups multiple analytics calls into batches, reducing 20-30 calls/day per user
 */

interface AnalyticsEvent {
  type: 'progress_update' | 'course_view' | 'lecture_complete' | 'engagement';
  courseId?: string;
  lectureId?: string;
  data: Record<string, any>;
  timestamp: number;
}

interface BatchedRequest {
  events: AnalyticsEvent[];
  resolvers: Array<(result: any) => void>;
  rejecters: Array<(error: any) => void>;
}

class AnalyticsBatcher {
  private queue: AnalyticsEvent[] = [];
  private resolvers: Array<(result: any) => void> = [];
  private rejecters: Array<(error: any) => void> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize = 10; // Max events per batch
  private readonly batchDelay = 5000; // 5 seconds max wait
  private readonly samplingRate = 0.7; // 70% of events get sent (sample non-critical analytics)

  /**
   * Add analytics event to batch queue
   */
  async addEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    return new Promise((resolve, reject) => {
      // SAMPLING: Skip non-critical events to reduce API load
      if (this.shouldSampleEvent(event) && Math.random() > this.samplingRate) {
        resolve(void 0); // Silently drop sampled events
        return;
      }

      const timestampedEvent: AnalyticsEvent = {
        ...event,
        timestamp: Date.now()
      };

      this.queue.push(timestampedEvent);
      this.resolvers.push(resolve);
      this.rejecters.push(reject);

      // Trigger batch if we hit the size limit
      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.batchTimeout) {
        // Start batch timer if not already running
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.batchDelay);
      }
    });
  }

  /**
   * Determine if event should be subject to sampling
   */
  private shouldSampleEvent(event: Omit<AnalyticsEvent, 'timestamp'>): boolean {
    // Don't sample critical events
    const criticalEvents = ['lecture_complete', 'progress_update'];
    return !criticalEvents.includes(event.type);
  }

  /**
   * Process the current batch of events
   */
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return;

    // Clear timeout if running
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Extract current batch
    const events = [...this.queue];
    const resolvers = [...this.resolvers];
    const rejecters = [...this.rejecters];

    // Clear queues
    this.queue = [];
    this.resolvers = [];
    this.rejecters = [];

    try {
      // Group events by type for optimized processing
      const groupedEvents = this.groupEventsByType(events);
      
      // Process each group
      const results = await Promise.allSettled([
        this.processProgressUpdates(groupedEvents.progress_update || []),
        this.processCourseViews(groupedEvents.course_view || []),
        this.processLectureCompletions(groupedEvents.lecture_complete || []),
        this.processEngagementEvents(groupedEvents.engagement || [])
      ]);

      // Resolve all promises
      resolvers.forEach(resolve => resolve(results));

    } catch (error) {
      console.error('Analytics batch processing failed:', error);
      // Reject all promises
      rejecters.forEach(reject => reject(error));
    }
  }

  /**
   * Group events by type for batch processing
   */
  private groupEventsByType(events: AnalyticsEvent[]): Record<string, AnalyticsEvent[]> {
    return events.reduce((groups, event) => {
      if (!groups[event.type]) {
        groups[event.type] = [];
      }
      groups[event.type].push(event);
      return groups;
    }, {} as Record<string, AnalyticsEvent[]>);
  }

  /**
   * Process batched progress updates
   */
  private async processProgressUpdates(events: AnalyticsEvent[]): Promise<any> {
    if (events.length === 0) return;

    // Group by lecture for bulk updates
    const progressByLecture = events.reduce((groups, event) => {
      const key = `${event.courseId}-${event.lectureId}`;
      if (!groups[key]) {
        groups[key] = {
          courseId: event.courseId!,
          lectureId: event.lectureId!,
          updates: []
        };
      }
      groups[key].updates.push(event.data);
      return groups;
    }, {} as Record<string, any>);

    // Send batched progress updates
    const updatePromises = Object.values(progressByLecture).map(async (batch: any) => {
      // Merge updates (latest values win)
      const mergedUpdate = batch.updates.reduce((merged: any, update: any) => ({
        ...merged,
        ...update,
        // Keep the latest timestamp
        lastUpdated: Math.max(merged.lastUpdated || 0, update.lastUpdated || Date.now())
      }), {});

      // Send single consolidated update per lecture
      return this.sendProgressUpdate(batch.lectureId, mergedUpdate);
    });

    return Promise.allSettled(updatePromises);
  }

  /**
   * Process batched course views (for analytics)
   */
  private async processCourseViews(events: AnalyticsEvent[]): Promise<any> {
    if (events.length === 0) return;

    // Aggregate views by course
    const viewsByCourse = events.reduce((views, event) => {
      const courseId = event.courseId!;
      if (!views[courseId]) {
        views[courseId] = {
          count: 0,
          firstView: event.timestamp,
          lastView: event.timestamp,
          totalDuration: 0
        };
      }
      views[courseId].count++;
      views[courseId].lastView = Math.max(views[courseId].lastView, event.timestamp);
      views[courseId].totalDuration += event.data.duration || 0;
      return views;
    }, {} as Record<string, any>);

    // Send aggregated view data
    return this.sendBatchedAnalytics('course_views', viewsByCourse);
  }

  /**
   * Process lecture completions
   */
  private async processLectureCompletions(events: AnalyticsEvent[]): Promise<any> {
    if (events.length === 0) return;

    // These are critical - process each one
    const completionPromises = events.map(event => 
      this.sendLectureCompletion(event.lectureId!, event.courseId!, event.data)
    );

    return Promise.allSettled(completionPromises);
  }

  /**
   * Process engagement events (sampling applied)
   */
  private async processEngagementEvents(events: AnalyticsEvent[]): Promise<any> {
    if (events.length === 0) return;

    // Aggregate engagement metrics
    const engagement = {
      totalEvents: events.length,
      eventTypes: events.reduce((types, event) => {
        const eventType = event.data.eventType || 'unknown';
        types[eventType] = (types[eventType] || 0) + 1;
        return types;
      }, {} as Record<string, number>),
      timeRange: {
        start: Math.min(...events.map(e => e.timestamp)),
        end: Math.max(...events.map(e => e.timestamp))
      }
    };

    return this.sendBatchedAnalytics('engagement', engagement);
  }

  /**
   * Send individual progress update
   */
  private async sendProgressUpdate(lectureId: string, data: any): Promise<any> {
    // This would integrate with your actual progress service
    // For now, just log the reduced API call
    console.log(`[BATCHED] Progress update for lecture ${lectureId}:`, data);
    
    // In a real implementation, this would call progressService.updateLectureProgress
    // return progressService.updateLectureProgress(lectureId, data);
  }

  /**
   * Send lecture completion
   */
  private async sendLectureCompletion(lectureId: string, courseId: string, data: any): Promise<any> {
    console.log(`[BATCHED] Lecture completion: ${lectureId} in course ${courseId}`);
    
    // In a real implementation:
    // return progressService.completeLecture(lectureId, courseId);
  }

  /**
   * Send batched analytics data
   */
  private async sendBatchedAnalytics(type: string, data: any): Promise<any> {
    console.log(`[BATCHED] Analytics batch (${type}):`, data);
    
    // In a real implementation, this would send to your analytics endpoint
    // return analyticsService.sendBatch(type, data);
  }

  /**
   * Force process any pending events (useful for page unload)
   */
  public async flush(): Promise<void> {
    if (this.queue.length > 0) {
      await this.processBatch();
    }
  }
}

// Singleton instance
const analyticsBatcher = new AnalyticsBatcher();

// Auto-flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analyticsBatcher.flush();
  });
}

export default analyticsBatcher;
export type { AnalyticsEvent };
