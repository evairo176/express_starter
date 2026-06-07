import { BlogCommentController } from './blogComment.controller';
import { BlogCommentService } from './blogComment.service';

const blogCommentService = new BlogCommentService();
const blogCommentController = new BlogCommentController(blogCommentService);

export { blogCommentService, blogCommentController };
