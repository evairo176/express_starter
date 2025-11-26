import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Import routes
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, morganMiddleware } from './middlewares';
import { config } from './config/app.config';
import authRoutes from './modules/auth/auth.routes';
import passport from './middlewares/passport';
import sessionRoutes from './modules/session/session.routes';
import mfaRoutes from './modules/mfa/mfa.routes';
// import { seedRoles } from './libs/seed';

const app = express();
const BASE_PATH = config.BASE_PATH;

// Add JSON middleware to parse incoming requests
app.use(express.json({ limit: '100mb' })); // Ubah limit menjadi 50MB
app.use(express.urlencoded({ extended: true })); // Ubah limit menjadi 50MB
// Use Helmet to secure Express app by setting various HTTP headers
app.use(helmet());
//set coookie
app.use(cookieParser());
app.use(passport.initialize());
// Enable CORS with various options
app.use(
  cors({
    origin: config.APP_ORIGIN,
    credentials: true,
  }),
);
// Use Morgan middleware for logging requests UPDATE
app.use(morganMiddleware);

// app.use(express.static('public'));
app.use('/public/uploads', express.static('public/uploads'));

app.get('/', (req, res) => {
  res.status(200).send(`Hello, TypeScript with Express!`);
});

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/mfa`, mfaRoutes);
app.use(`${BASE_PATH}/session`, sessionRoutes);

// app.use('/api/auth', authRouter);

// Swagger configuration options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Authentication API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: process.env.BASE_URL,
        description: 'Local server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

// seed

// seedRoles();
// seedBusinessLines();

// seedBusinessTypes();
// seedCompanyWithUser();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(errorHandler);
// app.use(notFound);

// Start the server and export the server instance
const server = app.listen(config.PORT, () => {
  console.log(
    `Server is running on http://localhost:${config.PORT}${BASE_PATH} in ${config.NODE_ENV}`,
  );
});

export { server };
export default app; // Tambahkan ini agar Vercel bisa menangkap aplikasi
