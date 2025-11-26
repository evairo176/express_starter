import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

const portfolioService = new PortfolioService();
const portfolioController = new PortfolioController(portfolioService);

export { portfolioService, portfolioController };
