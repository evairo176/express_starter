import { BlogPostController } from './blogPost.controller';
import { BlogPostService } from './blogPost.service';

const blogPostService = new BlogPostService();
const blogPostController = new BlogPostController(blogPostService);

export { blogPostService, blogPostController };
