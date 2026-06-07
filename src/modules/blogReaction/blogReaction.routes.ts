import { Router } from 'express';
import { writeLimiter } from '../../middlewares/rate-limit';
import { blogReactionController } from './blogReaction.module';

const blogReactionRoutes = Router();

// Public: add a reaction to a post resolved by slug (Req 5.1, 5.2, 5.3).
// Rate-limited write endpoint (Req 12.2).
blogReactionRoutes.post(
  '/public/:slug/reactions',
  writeLimiter,
  blogReactionController.create,
);

export default blogReactionRoutes;
