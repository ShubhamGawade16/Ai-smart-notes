interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

class Logger {
  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `${timestamp} [${level}] ${message}${formattedArgs}`;
  }

  error(message: string, ...args: any[]): void {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(this.formatMessage('INFO', message, ...args));
    }
  }

  debug(message: string, ...args: any[]): void {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, ...args));
    }
  }

  // Special method for user actions in production (always logged)
  userAction(action: string, userId: string, details?: any): void {
    const message = `User ${userId} performed: ${action}`;
    console.log(this.formatMessage('USER_ACTION', message, details));
  }

  // Special method for payment operations (always logged)
  payment(message: string, details?: any): void {
    console.log(this.formatMessage('PAYMENT', message, details));
  }

  // Special method for security events (always logged)
  security(message: string, details?: any): void {
    console.log(this.formatMessage('SECURITY', message, details));
  }
}

export const logger = new Logger();