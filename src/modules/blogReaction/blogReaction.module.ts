import { BlogReactionController } from './blogReaction.controller';
import { BlogReactionService } from './blogReaction.service';

const blogReactionService = new BlogReactionService();
const blogReactionController = new BlogReactionController(blogReactionService);

export { blogReactionService, blogReactionController };
