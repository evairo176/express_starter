"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
exports.db = globalThis.prisma ||
    new client_1.PrismaClient({
        transactionOptions: {
            maxWait: 5000,
            timeout: 10000,
        },
    });
if (process.env.NODE_ENV !== 'production')
    globalThis.prisma = exports.db;
