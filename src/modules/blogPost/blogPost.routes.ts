import { Router } from 'express';
import { authenticateJWT } from '../../common/strategies/jwt.strategy';
import { blogPostController } from './blogPost.module';
import { Role } from '../../common/enums/role.enum';
import { cacheMiddleware } from '../../middlewares/cache';

const blogPostRoutes = Router();

blogPostRoutes.get(
  '/public',
  cacheMiddleware({ tags: ['blog'] }),
  blogPostController.findAllPublic,
);
blogPostRoutes.get(
  '/public/:slug',
  cacheMiddleware({ tags: ['blog'] }),
  blogPostController.getPublicBySlug,
);
blogPostRoutes.post('/:id/view', blogPostController.incrementView);
blogPostRoutes.post('/:id/like', blogPostController.incrementLike);

blogPostRoutes.use(authenticateJWT);

blogPostRoutes.post('/', blogPostController.create);
blogPostRoutes.get('/', blogPostController.findAllAdmin);
blogPostRoutes.get('/:id', blogPostController.getOne);
blogPostRoutes.put('/:id', blogPostController.update);
// Category/tag assignment (Req 3.2, 3.3, 3.7).
blogPostRoutes.patch('/:id/taxonomy', blogPostController.assignTaxonomy);
blogPostRoutes.delete('/:id', blogPostController.destroy);

export default blogPostRoutes;
