import { PortfolioTagController } from './portfolioTag.controller';
import { PortfolioTagService } from './portfolioTag.service';

const portfolioTagService = new PortfolioTagService();
const portfolioTagController = new PortfolioTagController(portfolioTagService);

export { portfolioTagService, portfolioTagController };
