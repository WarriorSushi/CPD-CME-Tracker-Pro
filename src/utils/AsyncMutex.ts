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
    console.log(`🔐 ${this.name}: Lock requested by operation ${currentLockId}`);

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
      console.log(`🟢 ${this.name}: Lock acquired by operation ${currentLockId}`);
      this.locked = true;

      // Execute the protected function
      const result = await fn();
      console.log(`✅ ${this.name}: Operation ${currentLockId} completed successfully`);
      
      return result;
    } catch (error) {
      console.error(`💥 ${this.name}: Operation ${currentLockId} failed:`, error);
      throw error;
    } finally {
      this.locked = false;
      console.log(`🔓 ${this.name}: Lock released by operation ${currentLockId}`);
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
    console.log(`🔄 DatabaseMutex: Starting database init operation: ${operationName}`);
    return this.runExclusive(async () => {
      console.log(`🏗️ DatabaseMutex: Executing ${operationName}`);
      return await fn();
    });
  }

  /**
   * Specialized method for database write operations
   */
  async runDatabaseWrite<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
    console.log(`✏️ DatabaseMutex: Starting database write operation: ${operationName}`);
    return this.runExclusive(async () => {
      console.log(`📝 DatabaseMutex: Executing ${operationName}`);
      return await fn();
    });
  }

  /**
   * Specialized method for database read operations
   * Reads also need to be serialized to prevent NPEs during concurrent init/health checks
   */
  async runDatabaseRead<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
    console.log(`👁️ DatabaseMutex: Starting database read operation: ${operationName}`);
    return this.runExclusive(async () => {
      console.log(`📖 DatabaseMutex: Executing ${operationName}`);
      return await fn();
    });
  }

  /**
   * Specialized method for database cleanup operations
   */
  async runDatabaseCleanup<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
    console.log(`🧹 DatabaseMutex: Starting database cleanup operation: ${operationName}`);
    return this.runExclusive(async () => {
      console.log(`🗑️ DatabaseMutex: Executing ${operationName}`);
      return await fn();
    });
  }
}

// Export singleton instance
export const dbMutex = DatabaseMutex.getInstance();