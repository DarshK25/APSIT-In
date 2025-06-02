import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
    getSettings, 
    updateSettings,
    changePassword
} from '../controllers/settingsController.js';

const router = express.Router();

router.route('/')
    .get(protect, getSettings)
    .put(protect, updateSettings);

router.route('/change-password')
    .post(protect, changePassword);

export default router;