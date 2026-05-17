import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/upload.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('file'), ctrl.upload);

export default router;
