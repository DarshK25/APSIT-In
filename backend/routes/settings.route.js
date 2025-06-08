import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { 
    getSettings, 
    updateSettings,
    changePassword,
    deleteAccount
} from '../controllers/settings.controller.js';

const router = express.Router();

router.route('/')
    .get(protectRoute, getSettings)
    .put(protectRoute, updateSettings);

router.route('/change-password')
    .post(protectRoute, changePassword);

router.route('/delete-account')
    .post(protectRoute, deleteAccount);

export default router;