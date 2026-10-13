export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogPayload {
  level: LogLevel;
  message: string;
  requestId?: string;
  timestamp: string;
  service: string;
  context?: Record<string, unknown>;
}

class Logger {
  private readonly serviceName = 'resort-management-ecosystem';
  private recentLogs: LogPayload[] = [];
  private readonly maxRecentLogs = 100;

  public generateRequestId(): string {
    return 'req-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();
  }

  private formatLog(level: LogLevel, message: string, context?: Record<string, unknown>, requestId?: string): LogPayload {
    const payload: LogPayload = {
      level,
      message,
      requestId,
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      context,
    };

    // Lưu vào buffer xoay vòng phục vụ Dashboard giám sát
    this.recentLogs.unshift(payload);
    if (this.recentLogs.length > this.maxRecentLogs) {
      this.recentLogs.pop();
    }

    return payload;
  }

  public info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    const payload = this.formatLog('info', message, context, requestId);
    console.log(JSON.stringify(payload));
  }

  public warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    const payload = this.formatLog('warn', message, context, requestId);
    console.warn(JSON.stringify(payload));
  }

  public error(message: string, context?: Record<string, unknown>, requestId?: string): void {
    const payload = this.formatLog('error', message, context, requestId);
    console.error(JSON.stringify(payload));
  }

  public debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
      const payload = this.formatLog('debug', message, context, requestId);
      console.debug(JSON.stringify(payload));
    }
  }

  public http(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    requestId?: string,
    context?: Record<string, unknown>
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.formatLog(
      level,
      `HTTP ${method} ${path} ${statusCode} (${durationMs.toFixed(1)}ms)`,
      {
        method,
        path,
        statusCode,
        durationMs,
        ...context,
      },
      requestId
    );
  }

  public getRecentLogs(limit: number = 30): LogPayload[] {
    return this.recentLogs.slice(0, limit);
  }
}

export const logger = new Logger();
