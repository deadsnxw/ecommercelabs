import express from 'express';
import { getHealth } from '../controllers/HealthController.js';

const router = express.Router();

router.get('/health', getHealth);

export default router;