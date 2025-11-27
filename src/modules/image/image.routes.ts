import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { imageController } from './image.module';
import { fileFields, upload } from '../../cummon/utils/multer';

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
