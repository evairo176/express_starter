import { BlogTagController } from './blogTag.controller';
import { BlogTagService } from './blogTag.service';

const blogTagService = new BlogTagService();
const blogTagController = new BlogTagController(blogTagService);

export { blogTagService, blogTagController };
