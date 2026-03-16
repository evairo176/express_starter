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
const ticket_routes_1 = __importDefault(require("./modules/ticket/ticket.routes"));
const booking_routes_1 = __importDefault(require("./modules/booking/booking.routes"));
const claim_routes_1 = __importDefault(require("./modules/claim/claim.routes"));
const rolePermission_routes_1 = __importDefault(require("./modules/rolePermission/rolePermission.routes"));
const role_routes_1 = __importDefault(require("./modules/role/role.routes"));
const menu_routes_1 = __importDefault(require("./modules/menu/menu.routes"));
// import { seedRoles } from './libs/seed';
const app = (0, express_1.default)();
const BASE_PATH = app_config_1.config.BASE_PATH;
// Add JSON middleware to parse incoming requests
app.use(express_1.default.json({ limit: '100mb' })); // Ubah limit menjadi 50MB
app.use(express_1.default.urlencoded({ extended: true })); // Ubah limit menjadi 50MB
// Use Helmet to secure Express app by setting various HTTP headers
app.use((0, helmet_1.default)());
//set coookie
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
// Enable CORS with various options
app.use((0, cors_1.default)({
    origin: app_config_1.config.APP_ORIGIN,
    credentials: true,
}));
// Use Morgan middleware for logging requests UPDATE
app.use(middlewares_1.morganMiddleware);
// app.use(express.static('public'));
app.use('/public/uploads', express_1.default.static('public/uploads'));
app.get('/', (req, res) => {
    res.status(200).send(`Hello, TypeScript with Express!`);
});
app.use(`${BASE_PATH}/auth`, auth_routes_1.default);
app.use(`${BASE_PATH}/mfa`, mfa_routes_1.default);
app.use(`${BASE_PATH}/session`, session_routes_1.default);
app.use(`${BASE_PATH}/portfolio`, portfolio_routes_1.default);
app.use(`${BASE_PATH}/portfolio-category`, portfolioCategory_routes_1.default);
app.use(`${BASE_PATH}/portfolio-tag`, portfolioTag_routes_1.default);
app.use(`${BASE_PATH}/tech-stack`, techStack_routes_1.default);
app.use(`${BASE_PATH}/image`, image_routes_1.default);
app.use(`${BASE_PATH}/dashboard`, dashboard_routes_1.default);
app.use(`${BASE_PATH}/tickets`, ticket_routes_1.default);
app.use(`${BASE_PATH}/booking`, booking_routes_1.default);
app.use(`${BASE_PATH}/claims`, claim_routes_1.default);
app.use(`${BASE_PATH}/menu`, menu_routes_1.default);
app.use(`${BASE_PATH}/roles`, role_routes_1.default);
app.use(`${BASE_PATH}/role-permissions`, rolePermission_routes_1.default);
// app.use('/api/auth', authRouter);
// Swagger configuration options
// seed
// seedRoles();
// seedBusinessLines();
// seedBusinessTypes();
// seedCompanyWithUser();
app.use(`${BASE_PATH}/docs`, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerDocs));
app.use(middlewares_1.errorHandler);
// app.use(notFound);
// Start the server and export the server instance
const server = app.listen(app_config_1.config.PORT, () => {
    console.log(`Server is running on http://localhost:${app_config_1.config.PORT}${BASE_PATH} in ${app_config_1.config.NODE_ENV}`);
});
exports.server = server;
exports.default = app; // Tambahkan ini agar Vercel bisa menangkap aplikasi
