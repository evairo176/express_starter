import { BlogCategoryController } from './blogCategory.controller';
import { BlogCategoryService } from './blogCategory.service';

const blogCategoryService = new BlogCategoryService();
const blogCategoryController = new BlogCategoryController(blogCategoryService);

export { blogCategoryService, blogCategoryController };
