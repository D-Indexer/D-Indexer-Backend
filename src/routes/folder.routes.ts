import { Router } from 'express';
import * as ctrl from '../controllers/folder.controller';

const router = Router();

// /name/:name must be registered before /:address to avoid wildcard shadowing
router.get('/name/:name', ctrl.getByName);
router.get('/:address/credentials', ctrl.getCredentials);
router.get('/:address', ctrl.getByAddress);

export default router;
