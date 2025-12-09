"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDocs = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const app_config_1 = require("./app.config");
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Node.js Backend API',
            version: '1.0.0',
            description: 'API documentation for the Node.js Backend Starter',
        },
        servers: [
            {
                url: `${app_config_1.config.APP_ORIGIN}${app_config_1.config.BASE_PATH}`,
                description: `Server (${app_config_1.config.NODE_ENV})`,
            },
            {
                url: `http://localhost:${app_config_1.config.PORT}${app_config_1.config.BASE_PATH}`,
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/modules/**/*.routes.ts', './src/routes/*.ts'], // Path to the API docs
};
exports.swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
