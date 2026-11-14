/* eslint-disable no-console */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function sanitize(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    return data
      .replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED]')
      .replace(/accessKeyId["':\s]+[A-Za-z0-9]+/gi, 'accessKeyId: [REDACTED]')
      .replace(/secretAccessKey["':\s]+[A-Za-z0-9/+=]+/gi, 'secretAccessKey: [REDACTED]')
      .replace(/sessionToken["':\s]+[A-Za-z0-9/+=]+/gi, 'sessionToken: [REDACTED]');
  }
  if (typeof data === 'object') {
    const sanitizedObj: Record<string, any> = Array.isArray(data) ? [] : {};
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('credentials') ||
        lowerKey.includes('authorization')
      ) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitize(data[key]);
      }
    }
    return sanitizedObj;
  }
  return data;
}

export const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta ? sanitize(meta) : '');
  },
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta ? sanitize(meta) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error ? sanitize(error) : '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] ${message}`, meta ? sanitize(meta) : '');
    }
  }
};
