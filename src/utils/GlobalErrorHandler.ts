import { Platform } from 'react-native';

// Global error tracking
let errorCount = 0;
const MAX_ERRORS_PER_SESSION = 10;

export interface ErrorInfo {
  error: Error;
  source: 'javascript' | 'promise' | 'react' | 'native';
  timestamp: number;
  count: number;
  stack?: string;
  componentStack?: string;
}

class GlobalErrorHandler {
  private errorHandlers: ((errorInfo: ErrorInfo) => void)[] = [];
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // Handle unhandled JavaScript errors
    if (typeof global.ErrorUtils !== 'undefined') {
      const originalHandler = global.ErrorUtils.getGlobalHandler();

      global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.handleError({
          error,
          source: 'javascript',
          timestamp: Date.now(),
          count: ++errorCount,
          stack: error.stack,
        });

        // Call original handler if it exists
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // Handle unhandled promise rejections
    if (typeof global.addEventListener === 'function') {
      global.addEventListener('unhandledrejection', (event: any) => {
        const error = event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

        this.handleError({
          error,
          source: 'promise',
          timestamp: Date.now(),
          count: ++errorCount,
          stack: error.stack,
        });

        // Prevent default console logging in production
        if (!__DEV__) {
          event.preventDefault();
        }
      });
    }

    // Handle console errors (additional safety net)
    if (__DEV__ && typeof console.error === 'function') {
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        // Check if this looks like a React error
        if (args.length > 0 && typeof args[0] === 'string') {
          const message = args[0];
          if (message.includes('Warning:') || message.includes('Error:')) {
            const error = new Error(message);
            this.handleError({
              error,
              source: 'react',
              timestamp: Date.now(),
              count: ++errorCount,
              stack: error.stack,
            });
          }
        }

        // Call original console.error
        originalConsoleError.apply(console, args);
      };
    }
  }

  private handleError(errorInfo: ErrorInfo) {
    // Prevent error spam
    if (errorCount > MAX_ERRORS_PER_SESSION) {
      return;
    }

    // Log error in development
    if (__DEV__) {
      console.error(`[ERROR] GlobalErrorHandler [${errorInfo.source}]:`, errorInfo.error);
      if (errorInfo.stack) {
        console.error('Stack:', errorInfo.stack);
      }
    }

    // Notify all registered handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(errorInfo);
      } catch (handlerError) {
        if (__DEV__) {
          console.error('[ERROR] Error in error handler:', handlerError);
        }
      }
    });
  }

  addErrorHandler(handler: (errorInfo: ErrorInfo) => void) {
    this.errorHandlers.push(handler);

    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  getErrorCount(): number {
    return errorCount;
  }

  resetErrorCount(): void {
    errorCount = 0;
  }
}

export const globalErrorHandler = new GlobalErrorHandler();