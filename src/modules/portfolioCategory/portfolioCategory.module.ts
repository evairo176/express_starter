import { PortfolioCategoryController } from './portfolioCategory.controller';
import { PortfolioCategoryService } from './portfolioCategory.service';

const portfolioCategoryService = new PortfolioCategoryService();
const portfolioCategoryController = new PortfolioCategoryController(
  portfolioCategoryService,
);

export { portfolioCategoryService, portfolioCategoryController };
