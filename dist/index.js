"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Import routes
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const middlewares_1 = require("./middlewares");
const app_config_1 = require("./config/app.config");
const security_config_1 = require("./config/security.config");
const rate_limit_1 = require("./middlewares/rate-limit");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const passport_1 = __importDefault(require("./middlewares/passport"));
const session_routes_1 = __importDefault(require("./modules/session/session.routes"));
const mfa_routes_1 = __importDefault(require("./modules/mfa/mfa.routes"));
const portfolioCategory_routes_1 = __importDefault(require("./modules/portfolioCategory/portfolioCategory.routes"));
const portfolioTag_routes_1 = __importDefault(require("./modules/portfolioTag/portfolioTag.routes"));
const techStack_routes_1 = __importDefault(require("./modules/techStack/techStack.routes"));
const image_routes_1 = __importDefault(require("./modules/image/image.routes"));
const portfolio_routes_1 = __importDefault(require("./modules/portfolio/portfolio.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const blogPost_routes_1 = __importDefault(require("./modules/blogPost/blogPost.routes"));
const contact_routes_1 = __importDefault(require("./modules/contact/contact.routes"));
const newsletter_routes_1 = __importDefault(require("./modules/newsletter/newsletter.routes"));
const testimonial_routes_1 = __importDefault(require("./modules/testimonial/testimonial.routes"));
const achievement_routes_1 = __importDefault(require("./modules/achievement/achievement.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const blogCategory_routes_1 = __importDefault(require("./modules/blogCategory/blogCategory.routes"));
const blogTag_routes_1 = __importDefault(require("./modules/blogTag/blogTag.routes"));
const blogComment_routes_1 = __importDefault(require("./modules/blogComment/blogComment.routes"));
const blogReaction_routes_1 = __importDefault(require("./modules/blogReaction/blogReaction.routes"));
const seo_routes_1 = __importDefault(require("./modules/seo/seo.routes"));
const backup_routes_1 = __importDefault(require("./modules/backup/backup.routes"));
const backup_scheduler_1 = require("./modules/backup/backup.scheduler");
// import { seedRoles } from './libs/seed';
const app = (0, express_1.default)();
const BASE_PATH = app_config_1.config.BASE_PATH;
// --- Global middleware pipeline (order matters; see design "Request Pipeline") ---
// 1. Body parsing.
app.use(express_1.default.json({ limit: '100mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// 2. Helmet security headers (Req 12.3).
app.use((0, helmet_1.default)());
// 3. CORS restricted to a configured allowlist (Req 12.4).
app.use((0, cors_1.default)(security_config_1.corsOptions));
// 4. Cookie parsing + passport.
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
// 5. Request logging.
app.use(middlewares_1.morganMiddleware);
// app.use(express.static('public'));
app.use('/public/uploads', express_1.default.static('public/uploads'));
app.get('/', (req, res) => {
    res.status(200).send(`Hello, TypeScript with Express!`);
});
// SEO sitemap served at the root, NOT under BASE_PATH (route defines
// GET /sitemap.xml) (Req 13.1).
app.use('/', seo_routes_1.default);
// 6. Routes with per-router rate limiters and caching.
// Auth endpoints are protected by the stricter authLimiter (Req 12.1).
app.use(`${BASE_PATH}/auth`, rate_limit_1.authLimiter, auth_routes_1.default);
app.use(`${BASE_PATH}/mfa`, mfa_routes_1.default);
app.use(`${BASE_PATH}/session`, session_routes_1.default);
app.use(`${BASE_PATH}/portfolio`, portfolio_routes_1.default);
app.use(`${BASE_PATH}/portfolio-category`, portfolioCategory_routes_1.default);
app.use(`${BASE_PATH}/portfolio-tag`, portfolioTag_routes_1.default);
app.use(`${BASE_PATH}/tech-stack`, techStack_routes_1.default);
app.use(`${BASE_PATH}/image`, image_routes_1.default);
app.use(`${BASE_PATH}/dashboard`, dashboard_routes_1.default);
// Blog routers mounted at the same base path. The comment and reaction routers
// (per-route auth) MUST be registered BEFORE the blogPost router, whose
// catch-all `authenticateJWT` guard would otherwise shadow their public routes.
app.use(`${BASE_PATH}/blog-posts`, blogComment_routes_1.default);
app.use(`${BASE_PATH}/blog-posts`, blogReaction_routes_1.default);
app.use(`${BASE_PATH}/blog-posts`, blogPost_routes_1.default);
app.use(`${BASE_PATH}/blog-category`, blogCategory_routes_1.default);
app.use(`${BASE_PATH}/blog-tag`, blogTag_routes_1.default);
app.use(`${BASE_PATH}/testimonial`, testimonial_routes_1.default);
app.use(`${BASE_PATH}/achievements`, achievement_routes_1.default);
app.use(`${BASE_PATH}/analytics`, analytics_routes_1.default);
app.use(`${BASE_PATH}/backup`, backup_routes_1.default);
// Public write endpoints with writeLimiter applied inside their routers
// (contact submit, newsletter subscribe) (Req 12.2).
app.use(`${BASE_PATH}/contact`, contact_routes_1.default);
app.use(`${BASE_PATH}/newsletter`, newsletter_routes_1.default);
// app.use('/api/auth', authRouter);
// Swagger configuration options
// seed
// seedRoles();
// seedBusinessLines();
// seedBusinessTypes();
// seedCompanyWithUser();
app.use(`${BASE_PATH}/docs`, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerDocs));
// 404 handler for unmatched routes, then the error handler (must stay last).
app.use(middlewares_1.notFound);
app.use(middlewares_1.errorHandler);
// Start the server and export the server instance.
// Skip listening in test environment so Jest can import the app without
// trying to bind the port (and avoid conflicts with the dev server).
const server = process.env.NODE_ENV === 'test'
    ? undefined
    : app.listen(app_config_1.config.PORT, () => {
        console.log(`Server is running on http://localhost:${app_config_1.config.PORT}${BASE_PATH} in ${app_config_1.config.NODE_ENV}`);
        // Register the daily database-backup cron (00:00) once the server is up.
        (0, backup_scheduler_1.registerBackupCron)();
    });
exports.server = server;
exports.default = app; // Tambahkan ini agar Vercel bisa menangkap aplikasi
