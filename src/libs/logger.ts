import winston from 'winston';
import fs from 'fs';

// Pastikan folder logs ada sebelum digunakan (hanya untuk local)
const logDir = 'logs';
if (!fs.existsSync(logDir) && process.env.VERCEL !== '1') {
  fs.mkdirSync(logDir, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => (process.env.NODE_ENV === 'development' ? 'debug' : 'warn');

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// **Eksplisitkan tipe transports sebagai winston.transport[]**
const transports: winston.transport[] = [new winston.transports.Console()];

// **Hanya tambahkan file logging jika tidak berjalan di Vercel**
if (process.env.VERCEL !== '1') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/all.log' }),
  );
}

const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default Logger;
