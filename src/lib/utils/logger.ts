/**
 * Structured logging utility for production-safe logging
 * Only logs in development or when explicitly enabled
 */

interface LogContext {
  [key: string]: any;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enabledInProduction = process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true';
  private minLevel = LogLevel.INFO;

  private shouldLog(level: LogLevel): boolean {
    return (this.isDevelopment || this.enabledInProduction) && level >= this.minLevel;
  }

  private formatMessage(component: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${component}: ${message}${contextStr}`;
  }

  debug(component: string, message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(component, message, context));
    }
  }

  info(component: string, message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(component, message, context));
    }
  }

  warn(component: string, message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(component, message, context));
    }
  }

  error(component: string, message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(component, message, context));
    }
  }

  // Middleware-specific helper
  middleware(message: string, context?: LogContext): void {
    this.debug('MIDDLEWARE', message, context);
  }

  // Authentication-specific helper
  auth(message: string, context?: LogContext): void {
    this.debug('AUTH', message, context);
  }

  // API-specific helper
  api(message: string, context?: LogContext): void {
    this.debug('API', message, context);
  }
}

export const logger = new Logger();
