const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

type LogLevel = keyof typeof logLevels;

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (level === 'error') {
      console.error(prefix, message, ...args);
    } else if (level === 'warn') {
      console.warn(prefix, message, ...args);
    } else {
      console.log(prefix, message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      this.log('debug', message, ...args);
    }
  }
}

export const logger = new Logger();