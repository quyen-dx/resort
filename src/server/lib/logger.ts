export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  requestId?: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: Record<string, unknown>, requestId?: string): string {
    const payload: LogPayload = {
      level,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      context,
    };
    return JSON.stringify(payload);
  }

  public info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    console.log(this.formatLog('info', message, context, requestId));
  }

  public warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    console.warn(this.formatLog('warn', message, context, requestId));
  }

  public error(message: string, context?: Record<string, unknown>, requestId?: string): void {
    console.error(this.formatLog('error', message, context, requestId));
  }

  public debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, context, requestId));
    }
  }
}

export const logger = new Logger();
