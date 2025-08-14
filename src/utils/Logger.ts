/**
 * Production-safe logging utility
 * Automatically disables all logging in production builds
 */

const IS_DEVELOPMENT = __DEV__;

export class Logger {
  /**
   * Development-only logging - automatically disabled in production
   */
  static debug(message: string, ...args: any[]) {
    if (IS_DEVELOPMENT) {

    }
  }

  static info(message: string, ...args: any[]) {
    if (IS_DEVELOPMENT) {

    }
  }

  static warn(message: string, ...args: any[]) {
    if (IS_DEVELOPMENT) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  /**
   * Critical errors that should always be logged (even in production)
   * for crash reporting services
   */
  static error(message: string, error?: any) {
    if (IS_DEVELOPMENT) {
      __DEV__ && console.error(`💥 ${message}`, error);
    } else {
      // In production, could send to crash reporting service
      // For now, just use console.error for critical issues
      __DEV__ && console.error(message, error);
    }
  }

  /**
   * Performance logging for monitoring
   */
  static performance(operation: string, duration: number) {
    if (IS_DEVELOPMENT) {

    }
  }

  /**
   * User actions for audit (development only)
   */
  static userAction(action: string, details?: any) {
    if (IS_DEVELOPMENT) {

    }
  }
}

/**
 * Legacy console.log replacement for gradual migration
 * @deprecated Use Logger.debug() instead
 */
export const devLog = (...args: any[]) => {
  if (IS_DEVELOPMENT) {

  }
};