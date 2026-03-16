export const logger = {
  debug: (...args: any[]) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.log('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', ...args);
  },
};

