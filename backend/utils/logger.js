import winston from 'winston';
import 'winston-daily-rotate-file';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create daily rotate file transports
const errorTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/%DATE%-error.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  level: 'error',
  format: logFormat
});

const infoTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/%DATE%-info.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  level: 'info',
  format: logFormat
});

// Create logger instance
const logger = winston.createLogger({
  level: 'info',
  transports: [errorTransport, infoTransport]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
