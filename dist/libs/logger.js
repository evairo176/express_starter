"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const fs_1 = __importDefault(require("fs"));
// Pastikan folder logs ada sebelum digunakan (hanya untuk local)
const logDir = 'logs';
if (!fs_1.default.existsSync(logDir) && process.env.VERCEL !== '1') {
    fs_1.default.mkdirSync(logDir, { recursive: true });
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
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// **Eksplisitkan tipe transports sebagai winston.transport[]**
const transports = [new winston_1.default.transports.Console()];
// **Hanya tambahkan file logging jika tidak berjalan di Vercel**
if (process.env.VERCEL !== '1') {
    transports.push(new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }), new winston_1.default.transports.File({ filename: 'logs/all.log' }));
}
const Logger = winston_1.default.createLogger({
    level: level(),
    levels,
    format,
    transports,
});
exports.default = Logger;
