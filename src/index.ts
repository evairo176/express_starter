import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Import routes
import swaggerUi from 'swagger-ui-express';
import { swaggerDocs } from './config/swagger';
import { errorHandler, morganMiddleware, notFound } from './middlewares';
import { config } from './config/app.config';
import { corsOptions } from './config/security.config';
import { authLimiter } from './middlewares/rate-limit';
import authRoutes from './modules/auth/auth.routes';
import passport from './middlewares/passport';
import sessionRoutes from './modules/session/session.routes';
import mfaRoutes from './modules/mfa/mfa.routes';
import portfolioCategoryRoutes from './modules/portfolioCategory/portfolioCategory.routes';
import portfolioTagRoutes from './modules/portfolioTag/portfolioTag.routes';
import techStackRoutes from './modules/techStack/techStack.routes';
import imageRoutes from './modules/image/image.routes';
import portfolioRoutes from './modules/portfolio/portfolio.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import blogPostRoutes from './modules/blogPost/blogPost.routes';
import contactRoutes from './modules/contact/contact.routes';
import newsletterRoutes from './modules/newsletter/newsletter.routes';
import testimonialRoutes from './modules/testimonial/testimonial.routes';
import achievementRoutes from './modules/achievement/achievement.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import blogCategoryRoutes from './modules/blogCategory/blogCategory.routes';
import blogTagRoutes from './modules/blogTag/blogTag.routes';
import blogCommentRoutes from './modules/blogComment/blogComment.routes';
import blogReactionRoutes from './modules/blogReaction/blogReaction.routes';
import seoRoutes from './modules/seo/seo.routes';
import { registerBackupCron } from './modules/backup/backup.scheduler';
// import { seedRoles } from './libs/seed';

const app = express();
const BASE_PATH = config.BASE_PATH;

// --- Global middleware pipeline (order matters; see design "Request Pipeline") ---

// 1. Body parsing.
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));
// 2. Helmet security headers (Req 12.3).
app.use(helmet());
// 3. CORS restricted to a configured allowlist (Req 12.4).
app.use(cors(corsOptions));
// 4. Cookie parsing + passport.
app.use(cookieParser());
app.use(passport.initialize());
// 5. Request logging.
app.use(morganMiddleware);

// app.use(express.static('public'));
app.use('/public/uploads', express.static('public/uploads'));

app.get('/', (req, res) => {
  res.status(200).send(`Hello, TypeScript with Express!`);
});

// SEO sitemap served at the root, NOT under BASE_PATH (route defines
// GET /sitemap.xml) (Req 13.1).
app.use('/', seoRoutes);

// 6. Routes with per-router rate limiters and caching.
// Auth endpoints are protected by the stricter authLimiter (Req 12.1).
app.use(`${BASE_PATH}/auth`, authLimiter, authRoutes);
app.use(`${BASE_PATH}/mfa`, mfaRoutes);
app.use(`${BASE_PATH}/session`, sessionRoutes);
app.use(`${BASE_PATH}/portfolio`, portfolioRoutes);
app.use(`${BASE_PATH}/portfolio-category`, portfolioCategoryRoutes);
app.use(`${BASE_PATH}/portfolio-tag`, portfolioTagRoutes);
app.use(`${BASE_PATH}/tech-stack`, techStackRoutes);
app.use(`${BASE_PATH}/image`, imageRoutes);
app.use(`${BASE_PATH}/dashboard`, dashboardRoutes);

// Blog routers mounted at the same base path. The comment and reaction routers
// (per-route auth) MUST be registered BEFORE the blogPost router, whose
// catch-all `authenticateJWT` guard would otherwise shadow their public routes.
app.use(`${BASE_PATH}/blog-posts`, blogCommentRoutes);
app.use(`${BASE_PATH}/blog-posts`, blogReactionRoutes);
app.use(`${BASE_PATH}/blog-posts`, blogPostRoutes);

app.use(`${BASE_PATH}/blog-category`, blogCategoryRoutes);
app.use(`${BASE_PATH}/blog-tag`, blogTagRoutes);
app.use(`${BASE_PATH}/testimonial`, testimonialRoutes);
app.use(`${BASE_PATH}/achievements`, achievementRoutes);
app.use(`${BASE_PATH}/analytics`, analyticsRoutes);

// Public write endpoints with writeLimiter applied inside their routers
// (contact submit, newsletter subscribe) (Req 12.2).
app.use(`${BASE_PATH}/contact`, contactRoutes);
app.use(`${BASE_PATH}/newsletter`, newsletterRoutes);

// app.use('/api/auth', authRouter);

// Swagger configuration options

// seed

// seedRoles();
// seedBusinessLines();

// seedBusinessTypes();
// seedCompanyWithUser();

app.use(`${BASE_PATH}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// 404 handler for unmatched routes, then the error handler (must stay last).
app.use(notFound);
app.use(errorHandler);

// Start the server and export the server instance.
// Skip listening in test environment so Jest can import the app without
// trying to bind the port (and avoid conflicts with the dev server).
const server =
  process.env.NODE_ENV === 'test'
    ? undefined
    : app.listen(config.PORT, () => {
        console.log(
          `Server is running on http://localhost:${config.PORT}${BASE_PATH} in ${config.NODE_ENV}`,
        );
        // Register the daily database-backup cron (00:00) once the server is up.
        registerBackupCron();
      });

export { server };
export default app; // Tambahkan ini agar Vercel bisa menangkap aplikasi
