import express from 'express'
import { ProfileAttendance } from '../controllers/profileController';

const profileRouter = express.Router();

profileRouter.post('/profile', ProfileAttendance);

export default profileRouter;