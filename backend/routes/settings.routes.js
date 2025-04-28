import express from 'express';
import { protect } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';

const router = express.Router();

router.use(protect); // All settings routes require authentication

router.route('/')
    .get(getSettings)
    .put(updateSettings);

export default router; 