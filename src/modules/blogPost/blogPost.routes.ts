import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { blogPostController } from './blogPost.module';
import { Role } from '../../cummon/enums/role.enum';

const blogPostRoutes = Router();

blogPostRoutes.get('/public', blogPostController.findAllPublic);
blogPostRoutes.get('/public/:slug', blogPostController.getPublicBySlug);
blogPostRoutes.post('/:id/view', blogPostController.incrementView);
blogPostRoutes.post('/:id/like', blogPostController.incrementLike);

blogPostRoutes.use(authenticateJWT);

blogPostRoutes.post('/', blogPostController.create);
blogPostRoutes.get('/', blogPostController.findAllAdmin);
blogPostRoutes.get('/:id', blogPostController.getOne);
blogPostRoutes.put('/:id', blogPostController.update);
blogPostRoutes.delete('/:id', blogPostController.destroy);

export default blogPostRoutes;
