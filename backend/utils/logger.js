const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'info');

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = levels[LOG_LEVEL] || 1;

const getTimestamp = () => new Date().toISOString();

const logger = {
  debug: (...args) => {
    if (currentLevel <= 0) console.log(`[${getTimestamp()}] [DEBUG]`, ...args);
  },
  info: (...args) => {
    if (currentLevel <= 1) console.log(`[${getTimestamp()}] [INFO]`, ...args);
  },
  warn: (...args) => {
    if (currentLevel <= 2) console.warn(`[${getTimestamp()}] [WARN]`, ...args);
  },
  error: (...args) => {
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
  }
};

module.exports = logger;