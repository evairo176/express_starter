import { Router } from 'express';
import { authenticateJWT } from '../../common/strategies/jwt.strategy';
import { imageController } from './image.module';
import { fileFields, upload } from '../../common/utils/multer';

const imageRoutes = Router();

imageRoutes.post(
  '/',
  authenticateJWT,
  upload.fields(fileFields),
  imageController.create,
);

imageRoutes.get(
  '/',
  authenticateJWT,

  imageController.findAll,
);

export default imageRoutes;
