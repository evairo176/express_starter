import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './app.config';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node.js Backend API',
      version: '1.0.0',
      description: 'API documentation for the Node.js Backend Starter',
    },
    servers: [
      {
        url: `${config.APP_ORIGIN}${config.BASE_PATH}`,
        description: `Server (${config.NODE_ENV})`,
      },
      {
        url: `http://localhost:${config.PORT}${config.BASE_PATH}`,
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

export const swaggerDocs = swaggerJSDoc(swaggerOptions);
