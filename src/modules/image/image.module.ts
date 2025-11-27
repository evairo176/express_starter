import { ImageController } from './image.controller';
import { ImageService } from './image.service';

const imageService = new ImageService();
const imageController = new ImageController(imageService);

export { imageService, imageController };
