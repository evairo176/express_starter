import { Router } from 'express';
import { authenticateJWT } from '../../common/strategies/jwt.strategy';
import { dashboardController } from './dashboard.module';

const dashboardRoutes = Router();

// All dashboard management endpoints require authentication.
// Unauthenticated requests are rejected with a 401 (Req 10.3).
dashboardRoutes.use(authenticateJWT);

dashboardRoutes.get('/analytics', dashboardController.getAnalytics);

// Portfolio project admin CRUD + admin list + publish toggle (Req 10.1, 10.4, 10.6).
dashboardRoutes.get('/projects', dashboardController.listProjects);
dashboardRoutes.post('/projects', dashboardController.createProject);
dashboardRoutes.get('/projects/:id', dashboardController.getProject);
dashboardRoutes.put('/projects/:id', dashboardController.updateProject);
dashboardRoutes.delete('/projects/:id', dashboardController.deleteProject);
dashboardRoutes.patch(
  '/projects/:id/publish',
  dashboardController.toggleProjectPublished,
);

// Blog post admin CRUD + admin list + publish toggle (Req 10.2, 10.5, 10.6).
dashboardRoutes.get('/posts', dashboardController.listPosts);
dashboardRoutes.post('/posts', dashboardController.createPost);
dashboardRoutes.get('/posts/:id', dashboardController.getPost);
dashboardRoutes.put('/posts/:id', dashboardController.updatePost);
dashboardRoutes.delete('/posts/:id', dashboardController.deletePost);
dashboardRoutes.patch(
  '/posts/:id/publish',
  dashboardController.togglePostPublished,
);

export default dashboardRoutes;
