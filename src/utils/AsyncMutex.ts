// AsyncMutex - Ensures only one async operation runs at a time
// Used to prevent concurrent database operations that cause Android NPEs

export class AsyncMutex {
  private mutex: Promise<void> = Promise.resolve();
  private locked: boolean = false;
  private lockId: number = 0;

  constructor(private name: string = 'AsyncMutex') {}

  /**
   * Acquires the mutex and executes the provided function
   * Only one operation can run at a time
   */
  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const currentLockId = ++this.lockId;

    // Wait for the previous operation to complete
    const previousMutex = this.mutex;
    
    let resolve: (value: void | PromiseLike<void>) => void;
    let reject: (reason?: any) => void;
    
    // Create new promise for this operation
    this.mutex = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    try {
      // Wait for previous operation to complete
      await previousMutex;

      this.locked = true;

      // Execute the protected function
      const result = await fn();

      return result;
    } catch (error) {
      __DEV__ && console.error(`💥 ${this.name}: Operation ${currentLockId} failed:`, error);
      throw error;
    } finally {
      this.locked = false;

      resolve!(); // Resolve the mutex for the next operation
    }
  }

  /**
   * Checks if the mutex is currently locked
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Gets the current lock ID (for debugging)
   */
  getCurrentLockId(): number {
    return this.lockId;
  }
}

/**
 * Database-specific mutex singleton
 * This ensures all database operations are serialized
 */
class DatabaseMutex extends AsyncMutex {
  private static instance: DatabaseMutex;

  private constructor() {
    super('DatabaseMutex');
  }

  static getInstance(): DatabaseMutex {
    if (!DatabaseMutex.instance) {
      DatabaseMutex.instance = new DatabaseMutex();
    }
    return DatabaseMutex.instance;
  }

  /**
   * Specialized method for database initialization operations
   */
  async runDatabaseInit<T>(operationName: string, fn: () => Promise<T>): Promise<T> {

    return this.runExclusive(async () => {

      return await fn();
    });
  }

  /**
   * Specialized method for database write operations
   */
  async runDatabaseWrite<T>(operationName: string, fn: () => Promise<T>): Promise<T> {

    return this.runExclusive(async () => {

      return await fn();
    });
  }

  /**
   * Specialized method for database read operations
   * Reads also need to be serialized to prevent NPEs during concurrent init/health checks
   */
  async runDatabaseRead<T>(operationName: string, fn: () => Promise<T>): Promise<T> {

    return this.runExclusive(async () => {

      return await fn();
    });
  }

  /**
   * Specialized method for database cleanup operations
   */
  async runDatabaseCleanup<T>(operationName: string, fn: () => Promise<T>): Promise<T> {

    return this.runExclusive(async () => {

      return await fn();
    });
  }
}

// Export singleton instance
export const dbMutex = DatabaseMutex.getInstance();